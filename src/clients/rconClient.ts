import { Rcon } from "rcon-client";
import { serviceLogger as logger } from "../utils/logger";
import { ServerConfig } from "../types/server";

const rconConnections: Map<string, Rcon> = new Map();

export async function connectRcon(server: ServerConfig): Promise<Rcon | null> {
  const password = process.env[`${server.id}_rcon_pass`];
  if (!password) {
    logger.error(`RCON password not found for server id: ${server.id}`);
    return null;
  }

  if (!server.rconHost) {
    logger.error(`RCON host missing in config for server id: ${server.id}`);
    return null;
  }

  try {
    const rcon = await Rcon.connect({
      host: server.rconHost,
      port: server.rconPort,
      password,
    });

    logger.info(`[${server.id}] RCON connected`);

    rcon.on("end", () => {
      logger.warn(`[${server.id}] RCON connection ended`);
      rconConnections.delete(server.id);
    });

    rcon.on("error", (err) => {
      logger.error(`[${server.id}] RCON error: ${err instanceof Error ? err.message : err}`);
    });

    rconConnections.set(server.id, rcon);
    return rcon;

  } catch (err: any) {
    logger.error(`[${server.id}] RCON connection failed: ${err?.message ?? err}`);
    return null;
  }
}

export async function disconnectRcon(serverId: string): Promise<void> {
  const rcon = rconConnections.get(serverId);
  if (rcon) {
    await rcon.end();
    rconConnections.delete(serverId);
    logger.info(`[${serverId}] RCON connection closed`);
  }
}

export function getRcon(serverId: string): Rcon | undefined {
  return rconConnections.get(serverId);
}
