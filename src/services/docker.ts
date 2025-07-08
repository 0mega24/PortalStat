import { DockerStats } from "../types/docker";
import { ServerConfig } from "../types/server";
import Docker from 'dockerode';
import { totalCores } from '../utils/system';
import { serviceLogger as logger } from "../utils/logger";

const docker = new Docker();

const latestStats: Map<string, DockerStats> = new Map();

export async function startContainerStatsStreams(servers: ServerConfig[]) {
  logger.info(`Starting container stats streams for ${servers.length} servers`);

  servers.forEach(server => {
    if (server.dockerName) {
      logger.info(`Starting stats stream for container: ${server.dockerName}`);
      startContainerStatsStream(server.dockerName);
    } else {
      logger.warn(`Server ${server.id} does not have a dockerName, skipping stats stream.`);
    }
  });
}

export async function startContainerStatsStream(containerName: string) {
  try {
    const container = docker.getContainer(containerName);
    const statsStream = await container.stats({ stream: true });

    let buffer = '';
    logger.info(`Stats stream opened for container: ${containerName}`);

    statsStream.on('data', (chunk) => {
      buffer += chunk.toString();
      try {
        const stats = JSON.parse(buffer);
        buffer = '';

        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
        const systemCpuDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;

        const cpuPercent = systemCpuDelta > 0
          ? (cpuDelta / systemCpuDelta) * totalCores * 100.0
          : 0;

        const memUsage = stats.memory_stats?.usage || 0;
        const memActive = stats.memory_stats.stats?.active_file || 0;
        const memInactive = stats.memory_stats.stats?.inactive_file || 0;
        const memCache = memActive + memInactive;
        const actualMemUsed = memUsage - memCache;
        const memUsageGB = actualMemUsed / 1e9;

        latestStats.set(containerName, {
          cpuPercent: `${cpuPercent.toFixed(2)}`,
          memoryUsageGB: Number(memUsageGB.toFixed(2)),
        });

      } catch (parseError) {
        logger.warn(`Failed to parse stats data chunk for ${containerName}: ${parseError instanceof Error ? parseError.message : parseError}`);
      }
    });

    statsStream.on('error', (err) => {
      logger.error(`Stats stream error for ${containerName}: ${err instanceof Error ? err.message : err}`);
    });

    statsStream.on('end', () => {
      logger.warn(`Stats stream ended for ${containerName}`);
    });
  } catch (err) {
    logger.error(`Failed to start stats stream for ${containerName}: ${err instanceof Error ? err.message : err}`);
  }
}

export function getContainerStats(containerName: string) {
  return latestStats.get(containerName) || {
    cpuPercent: '0.00',
    memoryUsageGB: 0,
  };
}