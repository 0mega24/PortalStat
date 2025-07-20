import { servers } from "../config";
import { connectRcon, disconnectRcon, getRcon } from "../clients/rconClient";
import { serviceLogger as logger } from "../utils/logger";
import { ServerConfig } from "../types/server";
import { RconStats } from "../types/rcon";
import { updateStatus } from "./cache";

const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds

const pollingTimers: Map<string, NodeJS.Timeout> = new Map();

async function pollTps(server: ServerConfig) {
  const rcon = getRcon(server.id);
  if (!rcon) {
    logger.warn(`[${server.id}] RCON not connected, skipping poll`);
    return;
  }

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

      const stats: RconStats = {
        tps: tpsNum,
        mspt: msptNum,
      };

      updateStatus(server.id, { tps: stats });

      logger.info(`[${server.id}] Parsed TPS: ${tpsNum.toFixed(2)}, MSPT: ${msptNum.toFixed(2)}`);
    } else {
      logger.warn(`[${server.id}] Could not parse TPS`);
    }

  } catch (err: any) {
    logger.error(`[${server.id}] RCON TPS fetch failed: ${err?.message ?? err}`);
  }
}

export function startPolling(servers: ServerConfig[]) {
  logger.info(`Starting RCON polling for ${servers.length} servers`);

  servers.forEach(server => {
    if (!server.rconHost || !server.rconPort) {
      logger.warn(`[${server.id}] RCON polling is disabled, skipping`);
      return;
    }

    if (pollingTimers.has(server.id)) {
      logger.warn(`[${server.id}] RCON polling already active, skipping`);
      return;
    }

    startPoller(server.id);
  });
}

export async function startPoller(serverId: string) {
  const server = servers.find(s => s.id === serverId);
  if (!server) {
    logger.error(`Server config not found for id: ${serverId}`);
    return;
  }

  if (getRcon(serverId)) {
    logger.warn(`[${serverId}] RCON polling already active`);
    return;
  }

  const rcon = await connectRcon(server);
  if (!rcon) return;

  await pollTps(server);

  const timer = setInterval(async () => {
    if (!getRcon(serverId)) {
      clearInterval(timer);
      pollingTimers.delete(serverId);
      return;
    }
    await pollTps(server);
  }, POLL_INTERVAL_MS);

  pollingTimers.set(serverId, timer);
}

export async function stopPolling(serverId: string) {
  await disconnectRcon(serverId);

  const timer = pollingTimers.get(serverId);
  if (timer) {
    clearInterval(timer);
    pollingTimers.delete(serverId);
  }

  logger.info(`[${serverId}] RCON polling stopped`);
}
