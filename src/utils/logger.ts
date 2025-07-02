import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} ${level.toUpperCase()}: ${message}`)
  ),
  transports: [
    new transports.Console({ level: 'warn' }),
    new transports.File({ filename: 'logs/server.log', level: 'verbose' }),
  ],
});

export default logger;
