const statusCache: Map<string, any> = new Map<string, any>();

export function setStatus(id: string, data: any): void {
  statusCache.set(id, { data, timestamp: Date.now() });
}

export function getStatus(id: string): { data: any; timestamp: number } | undefined {
  return statusCache.get(id);
}