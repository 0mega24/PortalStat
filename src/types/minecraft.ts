export interface MinecraftStatusResponse {
  version: {
    name: string;
    protocol: number;
  };
  players: {
    max: number;
    online: number;
    sample?: { name: string; id: string }[];
  };
  description: string;
  favicon?: string;
}
