import { ServerConfig } from "../types/server";
import { statusJava } from "node-mcstatus";
import { setStatus } from "./cache";
import { formatDate } from "../utils/format";

export function startPolling(servers: ServerConfig[]) {
  servers.forEach((server) => {
    const poll = async () => {
      try {
        const result = await statusJava(server.host)
        setStatus(server.id, result);
        const expiresAt = (result as any)?.expires_at;
        const now = Date.now();
        console.log(`[${server.name}] updated: [${formatDate(now)}]`);
        let nextPollDelay = 30000;
        if (typeof expiresAt === "number" && expiresAt > now) {
          nextPollDelay = expiresAt - now + 100;
        }
        setTimeout(poll, nextPollDelay);
      } catch (err) {
        console.error(`[${server.name}] Poll failed:`, err);
        setTimeout(poll, 30000);
      }
    };
    poll();
  });
}
