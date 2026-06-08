import type { ComponentType, ReactNode } from "react";
import {
  Cpu,
  Server,
  HardDrive,
  AppWindow,
  HardDriveDownload,
  Mail,
  Calendar,
  Code2,
  Calculator,
  ExternalLink,
  BotMessageSquare
} from "lucide-react";
import { useConnectionStatus } from "@/app/shell/useConnectionStatus";
import { useSystemStatus } from "./useSystemStatus";
import { StatRow, formatMem, formatUptime } from "./desktopUi";
import { CalculatorApp } from "./CalculatorApp";
import { AiChatCard } from "@/features/dashboards/planner/AiChatCard";

function HostBody() {
  const { data } = useSystemStatus();
  if (!data) return <p className="muted">Reading host metrics…</p>;
  return (
    <div>
      <StatRow label="CPU" value={`${data.cpu.usage}%`} percent={data.cpu.usage} />
      <StatRow
        label="RAM"
        value={`${formatMem(data.memory.used)} / ${formatMem(data.memory.total)}`}
        percent={data.memory.percent}
      />
      <StatRow label="Temp" value={data.temp != null ? `${data.temp}°C` : "—"} />
      {data.gpu ? (
        <StatRow
          label="GPU"
          value={
            data.gpu.memUsed != null && data.gpu.memTotal != null
              ? `${data.gpu.usage}% · ${data.gpu.memUsed}/${data.gpu.memTotal} MB`
              : `${data.gpu.usage}%`
          }
          percent={data.gpu.usage}
        />
      ) : (
        <StatRow label="GPU" value="—" />
      )}
      <div style={{ marginTop: 4, fontSize: 11.5, color: "var(--ink-faint)" }}>
        {data.cpu.model} · {data.cpu.cores} cores
      </div>
    </div>
  );
}

function ServerBody() {
  const { data } = useSystemStatus();
  const connection = useConnectionStatus();
  const online = connection.tone === "online";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 13 }}>
        <span
          className="live-dot"
          style={{ background: online ? "#30d158" : "#ff453a", ...(online ? {} : { animation: "none" }) }}
        />
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>{online ? "Connected" : "Unreachable"}</span>
      </div>
      {data ? (
        <>
          <StatRow label="Server uptime" value={formatUptime(data.uptime)} />
          <StatRow label="Host uptime" value={formatUptime(data.hostUptime)} />
        </>
      ) : (
        <p className="muted">Checking server…</p>
      )}
    </div>
  );
}

function StorageBody() {
  const { data } = useSystemStatus();
  if (!data?.disk) return <p className="muted">Disk usage unavailable on this host.</p>;
  return (
    <StatRow label="Disk" value={`${data.disk.free} GB free / ${data.disk.total} GB`} percent={data.disk.percent} />
  );
}

type Utility = { label: string; href: string; icon: ReactNode };
const utilities: Utility[] = [
  { label: "Google Drive", href: "https://drive.google.com", icon: <HardDriveDownload size={18} /> },
  { label: "Gmail", href: "https://mail.google.com", icon: <Mail size={18} /> },
  { label: "Calendar", href: "https://calendar.google.com", icon: <Calendar size={18} /> },
  { label: "GitHub", href: "https://github.com", icon: <Code2 size={18} /> }
];

function UtilitiesBody() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
      {utilities.map((util) => (
        <a
          key={util.label}
          href={util.href}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 13px",
            borderRadius: 13,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--ink)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 500
          }}
        >
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 30,
              height: 30,
              borderRadius: 9,
              background: "rgba(255,255,255,0.1)",
              flex: "none"
            }}
          >
            {util.icon}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>{util.label}</span>
          <ExternalLink size={13} style={{ color: "var(--ink-faint)", flex: "none" }} />
        </a>
      ))}
    </div>
  );
}

export type PanelDef = {
  id: string;
  title: string;
  icon: ReactNode;
  Body: ComponentType;
};

function AgentBody() {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, margin: "-14px -16px -16px" }}>
      <AiChatCard />
    </div>
  );
}

export const PANELS: PanelDef[] = [
  { id: "host", title: "Host", icon: <Cpu size={14} />, Body: HostBody },
  { id: "server", title: "Server", icon: <Server size={14} />, Body: ServerBody },
  { id: "storage", title: "Storage", icon: <HardDrive size={14} />, Body: StorageBody },
  { id: "utilities", title: "Utilities", icon: <AppWindow size={14} />, Body: UtilitiesBody },
  { id: "calculator", title: "Calculator", icon: <Calculator size={14} />, Body: CalculatorApp },
  { id: "agent", title: "Aura Agent", icon: <BotMessageSquare size={14} />, Body: AgentBody }
];
