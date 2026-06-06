import { Router } from "express";
import { env } from "../env.js";
import { buildShellConfig, type ShellEnvConfig } from "../shellConfig.js";

export const shellRouter = Router();

export function getShellConfigResponse(config: ShellEnvConfig) {
  return buildShellConfig(config);
}

shellRouter.get("/", (_req, res) => {
  res.json(getShellConfigResponse({
    headerUserName: env.headerUserName,
    footerTickerItems: env.footerTickerItems
  }));
});
