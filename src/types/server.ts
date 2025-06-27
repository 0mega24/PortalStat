export interface ServerConfig {
  id: string;
  name: string;
  host: string;
  dockerName?: string;
  maxMemory?: number;
}