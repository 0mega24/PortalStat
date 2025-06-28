import { ServerConfig } from "../types/server";
import Docker from 'dockerode';
import { totalCores } from '../utils/system';
import logger from "../utils/logger";

const docker = new Docker();

const latestStats: Map<string, { cpuPercent: string, memoryUsageGB: number }> = new Map();

export async function startContainerStatsStreams(servers: ServerConfig[]) {
  servers.forEach(server => {
    if (server.dockerName) {
      startContainerStatsStream(server.dockerName);
    } else {
      logger.warn(`Server ${server.id} does not have a dockerName, skipping stats stream.`);
    }
  } );
}

export async function startContainerStatsStream(containerName: string) {
  const container = docker.getContainer(containerName);
  const statsStream = await container.stats({ stream: true });

  let buffer = '';

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
        cpuPercent: `~${cpuPercent.toFixed(2)}%`,
        memoryUsageGB: Number(memUsageGB.toFixed(2)),
      });
    } catch {
    }
  });

  statsStream.on('error', (err) => {
    console.error(`Stats stream error for ${containerName}:`, err);
  });

  statsStream.on('end', () => {
    console.warn(`Stats stream ended for ${containerName}`);
  });
}

export function getContainerStats(containerName: string) {
  return latestStats.get(containerName) || {
    cpuPercent: '~0.00%',
    memoryUsageGB: 0,
  };
}
