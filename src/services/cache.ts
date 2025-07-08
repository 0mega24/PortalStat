import { serviceLogger as logger } from "../utils/logger";
import { MinecraftStatusResponse } from "../types/minecraft";
import { CachedStatus } from "../types/cache";
import { DockerStats } from "../types/docker";
import { RconStats } from "../types/rcon";

const statusCache: Map<string, CachedStatus> = new Map<string, CachedStatus>();

export function setStatus(id: string, status: MinecraftStatusResponse): void {
  const prev = statusCache.get(id);
  statusCache.set(id, {
    status,
    docker: prev?.docker ?? null,
    tps: prev?.tps ?? null,
    timestamp: Date.now()
  });
  logger.info(`Status for ${id} (status) updated`);
}

export function setDocker(id: string, docker: DockerStats): void {
  const prev = statusCache.get(id);
  statusCache.set(id, {
    status: prev?.status ?? null,
    docker,
    tps: prev?.tps ?? null,
    timestamp: Date.now()
  });
  logger.info(`Status for ${id} (docker) updated`);
}

export function setTps(id: string, tps: RconStats): void {
  const prev = statusCache.get(id);
  statusCache.set(id, {
    status: prev?.status ?? null,
    docker: prev?.docker ?? null,
    tps,
    timestamp: Date.now()
  });
  logger.info(`Status for ${id} (tps) updated`);
}

export function getStatus(id: string): CachedStatus | undefined {
  if (!statusCache.has(id)) {
    logger.warn(`Status for ${id} not found in cache`);
    return undefined;
  }
  return statusCache.get(id);
}