import { Router } from "express";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import { readFile, statfs } from "fs/promises";
import { logger } from "../logger.js";

const execFileAsync = promisify(execFile);

export const systemRouter = Router();

export type SystemStatus = {
  uptime: number;
  hostUptime: number;
  cpu: { usage: number; cores: number; model: string };
  memory: { used: number; total: number; percent: number };
  disk: { free: number; total: number; percent: number } | null;
  temp: number | null;
  gpu: { usage: number; memUsed: number | null; memTotal: number | null } | null;
};

function cpuTimes() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const value of Object.values(cpu.times)) total += value;
    idle += cpu.times.idle;
  }
  return { idle, total };
}

// CPU usage by sampling aggregate idle/total over a short window.
async function getCpuUsage(): Promise<number> {
  const a = cpuTimes();
  await new Promise((resolve) => setTimeout(resolve, 120));
  const b = cpuTimes();
  const idleDelta = b.idle - a.idle;
  const totalDelta = b.total - a.total;
  if (totalDelta <= 0) return 0;
  return Math.round((1 - idleDelta / totalDelta) * 100);
}

async function getTemp(): Promise<number | null> {
  if (process.platform === "linux") {
    try {
      const raw = await readFile("/sys/class/thermal/thermal_zone0/temp", "utf8");
      const milli = parseInt(raw.trim(), 10);
      if (Number.isFinite(milli)) return Math.round(milli / 1000);
    } catch {
      // no thermal zone available
    }
  }
  return null;
}

async function getGpu(): Promise<SystemStatus["gpu"]> {
  try {
    const { stdout } = await execFileAsync("nvidia-smi", [
      "--query-gpu=utilization.gpu,memory.used,memory.total",
      "--format=csv,noheader,nounits"
    ]);
    const line = stdout.trim().split("\n")[0];
    const [usage, memUsed, memTotal] = line.split(",").map((part) => parseInt(part.trim(), 10));
    if (Number.isFinite(usage)) {
      return {
        usage,
        memUsed: Number.isFinite(memUsed) ? memUsed : null,
        memTotal: Number.isFinite(memTotal) ? memTotal : null
      };
    }
  } catch {
    // no NVIDIA GPU / nvidia-smi not present
  }
  return null;
}

async function getDisk(): Promise<SystemStatus["disk"]> {
  try {
    // statfs is cross-platform (Node 18.15+); pick the root for the platform.
    const root = process.platform === "win32" ? "C:\\" : "/";
    const stats = await statfs(root);
    const blockSize = stats.bsize;
    const totalB = stats.blocks * blockSize;
    const freeB = stats.bavail * blockSize;
    if (totalB > 0) {
      return {
        free: Math.round(freeB / 1e9),
        total: Math.round(totalB / 1e9),
        percent: Math.round(((totalB - freeB) / totalB) * 100)
      };
    }
  } catch {
    // disk usage unavailable
  }
  return null;
}

systemRouter.get("/status", async (_req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpus = os.cpus();

    const [cpuUsage, disk, temp, gpu] = await Promise.all([getCpuUsage(), getDisk(), getTemp(), getGpu()]);

    const status: SystemStatus = {
      uptime: process.uptime(),
      hostUptime: os.uptime(),
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        model: cpus[0]?.model?.trim() ?? "Unknown CPU"
      },
      memory: {
        used: Math.round(usedMem / 1024 / 1024),
        total: Math.round(totalMem / 1024 / 1024),
        percent: Math.round((usedMem / totalMem) * 100)
      },
      disk,
      temp,
      gpu
    };

    res.json(status);
  } catch (error) {
    logger.error("System status check failed", error, { route: "/api/system/status" });
    res.status(500).json({ message: "System status unavailable" });
  }
});
