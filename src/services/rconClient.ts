import { Rcon } from "rcon-client";
import logger from "../utils/logger";
import { servers } from "../config";
import type { ServerConfig } from "../types/server";

export async function fetchTPSRconById(
  id: string
): Promise<{ tps: number; mspt: number } | null> {
  const server: ServerConfig | undefined = servers.find(s => s.id === id);

  if (!server) {
    logger.error(`Server config not found for id: ${id}`);
    return null;
  }

  const host = server.host;
  const port = server.rconPort;
  const command = server.rconCommand;
  const matchRegex = server.rconMatchRegex ? new RegExp(server.rconMatchRegex) : /Overall\s+:\s+Mean tick time:\s+([\d.]+)\s+ms\.\s+Mean TPS:\s+([\d.]+)/;

  if (!host || !port || !command) {
    logger.error(`Server config for id ${id} missing host, rconPort or rconCommand`);
    return null;
  }

  const password = process.env[`${id}_rcon_pass`];
  if (!password) {
    logger.error(`RCON password not found in environment for server id: ${id}`);
    return null;
  }

  try {
    const rcon: Rcon = await Rcon.connect({ host, port, password });
    const response: string = await rcon.send(command);
    logger.info(`[${id}] RCON TPS response: ${response}`);

    const match = response.match(matchRegex);
    if (match && match.length >= 3) {
      const [, tickTime, tps] = match;
      const tpsNum = parseFloat(tps);
      const msptNum = parseFloat(tickTime);
      logger.info(`[${id}] Parsed Overall: ${tpsNum.toFixed(2)} TPS, ${msptNum.toFixed(2)} mspt`);
      await rcon.end();
      return { tps: tpsNum, mspt: msptNum };
    } else {
      logger.warn(`[${id}] Could not parse Overall TPS`);
      await rcon.end();
      return null;
    }
  } catch (err: any) {
    logger.error(`[${id}] RCON TPS fetch failed: ${err?.message ?? err}`);
    return null;
  }
}
