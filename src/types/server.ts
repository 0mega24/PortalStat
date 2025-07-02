export interface ServerConfig {
  id: string;
  name: string;
  host: string;
  port?: number;
  rconPort?: number;
  rconCommand?: string;
  rconMatchRegex?: string;
  dockerName?: string;
  maxMemory?: number;
}