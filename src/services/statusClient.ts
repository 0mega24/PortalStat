import net from "net";
import { serviceLogger as logger } from "../utils/logger";
import { MinecraftStatusResponse } from "../types/minecraft";

export class MinecraftStatus {
  host: string;
  port: number;
  timeout: number;

  constructor(host: string, port = 25565, timeout = 5000) {
    this.host = host;
    this.port = port; // default Minecraft port is 25565
    this.timeout = timeout; // default timeout is 5 seconds
  }

  /**
   * Encodes an integer using VarInt formating.
   * Allows the Minecraft protocol sends lengths and IDs.
   */
  private writeVarInt(value: number): Buffer {
    const buffer: number[] = [];
    while (true) {
      if ((value & 0xffffff80) === 0) {
        buffer.push(value);
        break;
      }
      buffer.push((value & 0x7f) | 0x80);
      value >>>= 7; // unsigned right shift by 7 bits
    }
    return Buffer.from(buffer);
  }

  async status(): Promise<MinecraftStatusResponse> {
    return new Promise<MinecraftStatusResponse>((resolve, reject) => {
      logger.info(`Connecting to Minecraft server at ${this.host}:${this.port}`);
      const socket = new net.Socket();
      socket.setTimeout(this.timeout);

      const protocolVersion = 754;
      const serverAddress = Buffer.from(this.host, "utf8");
      const serverPort = Buffer.alloc(2);
      serverPort.writeUInt16BE(this.port);

      /**
       * Build handshake packet according to Minecraft's protocol.
       * Packet structure: [packet ID][protocol version][server address][server port][next state]
       * - packet ID: 0x00 for handshake
       * - next state: 0x01 means status
       */
      const handshakeData = Buffer.concat([
        this.writeVarInt(0x00),
        this.writeVarInt(protocolVersion),
        this.writeVarInt(serverAddress.length),
        serverAddress,
        serverPort,
        Buffer.from([0x01]),
      ]);

      const handshakePacket = Buffer.concat([
        this.writeVarInt(handshakeData.length),
        handshakeData,
      ]);

      // Status request packet
      const requestPacket = Buffer.from([0x01, 0x00]);

      let responseBuffer = Buffer.alloc(0);

      socket.connect(this.port, this.host, () => {
        logger.info(`${this.host}:${this.port} connected, sending handshake and status request packets.`);
        socket.write(handshakePacket);
        socket.write(requestPacket);
      });

      socket.on("data", (chunk) => {
        responseBuffer = Buffer.concat([responseBuffer, chunk]);

        // Helper to skip over a VarInt-encoded value in the buffer
        function skipVarInt(buf: Buffer, offset: number): number {
          while (buf[offset] & 0x80) offset++;
          return offset + 1;
        }

        let i = 0;

        // Skip total length and packet ID
        i = skipVarInt(responseBuffer, i); // Length prefix
        i = skipVarInt(responseBuffer, i); // Packet ID

        // Read JSON payload length (VarInt)
        let jsonLength = 0;
        let shift = 0;
        while (true) {
          if (i >= responseBuffer.length) return; // Wait for more data if needed
          const byte = responseBuffer[i++];
          jsonLength |= (byte & 0x7f) << shift;
          if ((byte & 0x80) !== 0x80) break;
          shift += 7;
        }

        const remaining = responseBuffer.length - i;
        if (remaining < jsonLength) return; // Wait for complete payload

        const jsonString = responseBuffer.slice(i, i + jsonLength).toString();
        logger.info(`Received status JSON: ${this.host}`);

        try {
          const status: MinecraftStatusResponse = JSON.parse(jsonString);
          resolve(status);
          socket.end();
        } catch (parseErr) {
          logger.error(`Failed to parse status JSON: ${parseErr}`);
          reject(parseErr);
          socket.end();
        }
      });

      socket.on("timeout", () => {
        logger.error(`${this.host}:${this.port} status request timed out.`);
        reject(new Error("Timeout"));
        socket.end();
      });

      socket.on("error", (err) => {
        logger.error(`${this.host}:${this.port} status socket error: ${err}`);
        reject(err);
      });
    });
  }
}

/**
 * Helper function to fetch a specific Minecraft server's status.
 */
export async function fetchMinecraftStatus(host: string, port = 25565): Promise<MinecraftStatusResponse> {
  const status = new MinecraftStatus(host, port);
  try {
    return await status.status();
  } catch (err) {
    logger.error(`Failed to fetch ${host}:${port} status:`, err);
    throw err;
  }
}
