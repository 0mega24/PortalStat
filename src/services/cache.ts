import logger from "../utils/logger";

const statusCache: Map<string, any> = new Map<string, any>();

export function setStatus(id: string, data: any): void {
  statusCache.set(id, { data, timestamp: Date.now() });
  logger.info(`Status for ${id} updated`);
}

export function getStatus(id: string): {
  online: any; data: any; timestamp: number
} | undefined {
  if (!statusCache.has(id)) {
    logger.warn(`Status for ${id} not found in cache`);
    return undefined;
  }
  return statusCache.get(id);
}