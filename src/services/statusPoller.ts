import { ServerConfig } from "../types/server";
import { statusJava } from "node-mcstatus";
import { setStatus } from "./cache";
import logger from "../utils/logger";

type PollTask = () => Promise<void>;

export function startPolling(servers: ServerConfig[]) {
  const queue: PollTask[] = [];
  let isProcessing = false;

  servers.forEach(server => {
    const poll = async () => {
      try {
        const result = await statusJava(server.host);
        setStatus(server.id, result);
        const expiresAt = (result as any)?.expires_at;
        const now = Date.now();
        logger.info(`[${server.name}] Poll successful`);

        let nextPollDelay = 30000;
        if (typeof expiresAt === "number" && expiresAt > now) {
          nextPollDelay = expiresAt - now + 100;
        }

        setTimeout(() => {
          queue.push(poll);
          processQueue();
        }, nextPollDelay);
      } catch (err) {
        logger.error(`${server.name} Poll failed:`, err);

        setTimeout(() => {
          queue.push(poll);
          processQueue();
        }, 30000);
      }
    };

    queue.push(poll);
  });

  async function processQueue() {
    if (isProcessing) return;

    isProcessing = true;

    while (queue.length > 0) {
      const batch = queue.splice(0, 5);

      await Promise.all(batch.map(task => task()));

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    isProcessing = false;
  }

  processQueue();
}
