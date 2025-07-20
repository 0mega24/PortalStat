import { ServerConfig } from "../types/server";
import { fetchMinecraftStatus } from "../clients/statusClient";
import { updateStatus } from "./cache";
import { serviceLogger as logger } from "../utils/logger";
import { PollerTask } from "../types/poller";

/**
 * Starts polling Minecraft servers and updating their status.
 */
export function startPolling(servers: ServerConfig[]) {
  const queue: PollerTask[] = [];
  let isProcessing = false;

  servers.forEach(server => {
    /**
     * Polls a single server and reschedules itself based on success or failure.
     */
    const poll = async () => {
      try {
        const result = await fetchMinecraftStatus(server.host, server.port);
        updateStatus(server.id, { status: result });

        logger.info(`[${server.host}] Poll successful`);

        // On success: poll again after 30 seconds
        setTimeout(() => {
          queue.push(poll);
          processQueue();
        }, 30000);
      } catch (err) {
        logger.error(`${server.host} Poll failed:`, err);

        // On failure: retry after 60 seconds
        setTimeout(() => {
          queue.push(poll);
          processQueue();
        }, 60000);
      }
    };

    // Add initial poll for this server to the queue
    queue.push(poll);
  });

  /**
   * Processes the queue in batches.
   * Runs up to 5 tasks concurrently.
   */
  async function processQueue() {
    if (isProcessing) return;

    isProcessing = true;

    while (queue.length > 0) {
      const batch = queue.splice(0, 5); // Process max 5 tasks at once

      await Promise.all(batch.map(task => task()));

      // Small delay between batches to spread out load
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    isProcessing = false;
  }

  // Start processing immediately
  processQueue();
}
