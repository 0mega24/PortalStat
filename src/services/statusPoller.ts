import { ServerConfig } from "../types/server";
import { fetchMinecraftStatus } from "./statusClient";
import { setStatus } from "./cache";
import logger from "../utils/logger";

type PollTask = () => Promise<void>;

export function startPolling(servers: ServerConfig[]) {
  const queue: PollTask[] = [];
  let isProcessing = false;

  servers.forEach(server => {
    const poll = async () => {
      try {
        const result = await fetchMinecraftStatus(server.host, server.port);
        setStatus(server.id, result);

        logger.info(`[${server.host}] Poll successful`);

        setTimeout(() => {
          queue.push(poll);
          processQueue();
        }, 30000);
      } catch (err) {
        logger.error(`${server.host} Poll failed:`, err);

        setTimeout(() => {
          queue.push(poll);
          processQueue();
        }, 15000);
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
