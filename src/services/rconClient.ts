import { Rcon } from "rcon-client";
import { serviceLogger as logger } from "../utils/logger";
import { servers } from "../config";
import type { ServerConfig } from "../types/server";
import { RconStats } from "../types/rcon";

const rconConnections: Map<string, Rcon> = new Map();
const latestTpsStats: Map<string, RconStats> = new Map();
const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds
const pollingTimers: Map<string, NodeJS.Timeout> = new Map();

async function connectRcon(server: ServerConfig): Promise<Rcon | null> {
  const password = process.env[`${server.id}_rcon_pass`];
  if (!password) {
    logger.error(`RCON password not found in environment for server id: ${server.id}`);
    return null;
  }

  try {
    if (!server.rconHost) {
      logger.error(`RCON host not found in server config for server id: ${server.id}`);
      return null;
    }
    const rcon = await Rcon.connect({ host: server.rconHost, port: server.rconPort, password });
    logger.info(`[${server.id}] RCON connected`);
    rcon.on("end", () => {
      logger.warn(`[${server.id}] RCON connection ended`);
      rconConnections.delete(server.id);
      setTimeout(() => startRconPolling(server.id), 5000);
    });
    rcon.on("error", (err) => {
      logger.error(`[${server.id}] RCON error: ${err instanceof Error ? err.message : err}`);
    });
    return rcon;
  } catch (err: any) {
    logger.error(`[${server.id}] RCON connection failed: ${err?.message ?? err}`);
    return null;
  }
}

async function pollTps(server: ServerConfig, rcon: Rcon): Promise<void> {
  const command = server.rconCommand!;
  const matchRegex = server.rconMatchRegex
    ? new RegExp(server.rconMatchRegex)
    : /Overall\s+:\s+Mean tick time:\s+([\d.]+)\s+ms\.\s+Mean TPS:\s+([\d.]+)/;

  try {
    const response = await rcon.send(command);
    logger.info(`[${server.id}] RCON TPS response: ${response}`);

    const match = response.match(matchRegex);
    if (match && match.length >= 3) {
      const [, tickTime, tps] = match;
      const tpsNum = parseFloat(tps);
      const msptNum = parseFloat(tickTime);
      latestTpsStats.set(server.id, { tps: tpsNum, mspt: msptNum });
      logger.info(`[${server.id}] Parsed Overall: ${tpsNum.toFixed(2)} TPS, ${msptNum.toFixed(2)} mspt`);
    } else {
      logger.warn(`[${server.id}] Could not parse Overall TPS`);
    }
  } catch (err: any) {
    logger.error(`[${server.id}] RCON TPS fetch failed: ${err?.message ?? err}`);
  }
}

export async function startRconPolling(id: string) {
  const server = servers.find(s => s.id === id);
  if (!server) {
    logger.error(`Server config not found for id: ${id}`);
    return;
  }
  if (!server.rconHost || !server.rconPort || !server.rconCommand) {
    logger.error(`Server config for id ${id} missing rconHost, rconPort, or rconCommand`);
    return;
  }

  if (rconConnections.has(id)) {
    logger.warn(`[${id}] RCON polling already started`);
    return;
  }

  const rcon = await connectRcon(server);
  if (!rcon) return;

  rconConnections.set(id, rcon);

  await pollTps(server, rcon);

  const timer = setInterval(async () => {
    if (!rconConnections.has(id)) {
      clearInterval(timer);
      pollingTimers.delete(id);
      return;
    }
    await pollTps(server, rcon);
  }, POLL_INTERVAL_MS);

  pollingTimers.set(id, timer);
}

export async function stopRconPolling(id: string) {
  const rcon = rconConnections.get(id);
  if (rcon) {
    await rcon.end();
    rconConnections.delete(id);
  }
  const timer = pollingTimers.get(id);
  if (timer) {
    clearInterval(timer);
    pollingTimers.delete(id);
  }
  latestTpsStats.delete(id);
  logger.info(`[${id}] Stopped RCON polling`);
}

export function getLatestTpsStats(id: string): RconStats | null {
  return latestTpsStats.get(id) || null;
}