import { CachedStatus } from "./cache";
import { DockerStats } from "./docker";

export type StatusResponse = CachedStatus | { error: string };

export interface StatusSummary {
  online: boolean;
  description: unknown;
  version: {
    name: string | null;
  };
  players: {
    online: number;
    max: number;
    list: { name: string; id: string }[];
  };
  container?: {
    cpuPercent: string | null;
    memoryUsageGB: number | null;
  };
  tps?: {
    tps: number;
    mspt: number;
  }
}

export type StatusSummaryResponse = StatusSummary | { online: false; error: string };

export type PingResponse = { pong: true; time: number; server?: string } | { error: string };

export type ResourceUsageResponse = DockerStats | { error: string; details?: string };
