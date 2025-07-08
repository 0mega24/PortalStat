import { DockerStats } from "./docker";
import { MinecraftStatusResponse } from "./minecraft";
import { RconStats } from "./rcon";

export interface CachedStatus {
  status: MinecraftStatusResponse | null;
  docker: DockerStats | null;
  tps: RconStats | null;
  timestamp: number;
}