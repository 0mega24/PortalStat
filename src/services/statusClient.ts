import net from "net";
import logger from "../utils/logger";

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
  description: unknown;
  favicon?: string;
  enforcesSecureChat?: boolean;
  previewsChat?: boolean;
}

export class MinecraftStatus {
  host: string;
  port: number;
  timeout: number;

  constructor(host: string, port = 25565, timeout = 5000) {
    this.host = host;
    this.port = port;
    this.timeout = timeout;
  }

  private writeVarInt(value: number): Buffer {
    const buffer: number[] = [];
    while (true) {
      if ((value & 0xffffff80) === 0) {
        buffer.push(value);
        break;
      }
      buffer.push((value & 0x7f) | 0x80);
      value >>>= 7;
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

      const requestPacket = Buffer.from([0x01, 0x00]);

      let responseBuffer = Buffer.alloc(0);

      socket.connect(this.port, this.host, () => {
        logger.info(`${this.host}:${this.port} connected, sending handshake and status request packets.`);
        socket.write(handshakePacket);
        socket.write(requestPacket);
      });

      socket.on("data", (chunk) => {
        responseBuffer = Buffer.concat([responseBuffer, chunk]);

        let i = 0;

        while (responseBuffer[i] & 0x80) i++;
        i++;

        while (responseBuffer[i] & 0x80) i++;
        i++;

        let jsonLength = 0;
        let shift = 0;
        while (true) {
          if (i >= responseBuffer.length) return;
          const byte = responseBuffer[i++];
          jsonLength |= (byte & 0x7f) << shift;
          if ((byte & 0x80) !== 0x80) break;
          shift += 7;
        }

        const remaining = responseBuffer.length - i;
        if (remaining < jsonLength) return;

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

export async function fetchMinecraftStatus(host: string, port = 25565): Promise<MinecraftStatusResponse> {
  const status = new MinecraftStatus(host, port);
  try {
    return await status.status();
  } catch (err) {
    logger.error("Failed to fetch ${this.host}:${this.port} status:", err);
    throw err;
  }
}
