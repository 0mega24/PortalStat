import { createLogger, format, transports } from 'winston';

const logFormat = format.printf(
  ({ timestamp, level, label, message }) =>
    `[${label}] ${level}: ${message}: ${timestamp}`
);

const createLoggerWithOptions = (label: string, filename: string, level = 'info') => {
  const fileTransport = new transports.File({
    filename: `logs/${filename}.log`,
    level: level,
    format: logFormat,
  });

  const consoleTransport = new transports.Console({
    level: 'warn',
    format: format.combine(format.colorize(), logFormat),
  });

  return createLogger({
    level,
    format: format.combine(format.timestamp(), format.label({ label })),
    transports: [consoleTransport, fileTransport],
  });
};

export const logger = createLoggerWithOptions('Server', 'server');

const forwardingTransport = new transports.File({
  filename: 'logs/server.log',
  level: 'warn',
  format: logFormat,
});

export const apiLogger = createLoggerWithOptions('API', 'api', 'verbose');
apiLogger.add(forwardingTransport);

export const clientLogger = createLoggerWithOptions('Client', 'client', 'verbose');
clientLogger.add(forwardingTransport);

export const serviceLogger = createLoggerWithOptions('Service', 'service', 'verbose');
serviceLogger.add(forwardingTransport);

export default logger;
