import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logDir = process.env.LOG_DIR || './logs';
const logLevel = process.env.LOG_LEVEL || 'info';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create logger
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'pdca-backend' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // Error log file
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
    }),

    // Combined log file
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),

    // Integration log file (for external system calls)
    new DailyRotateFile({
      filename: path.join(logDir, 'integration-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format((info) => {
          return info.context === 'integration' ? info : false;
        })(),
        logFormat
      ),
    }),
  ],
});

// Create specialized loggers
export const integrationLogger = {
  info: (message: string, meta?: any) => {
    logger.info(message, { context: 'integration', ...meta });
  },
  error: (message: string, meta?: any) => {
    logger.error(message, { context: 'integration', ...meta });
  },
  warn: (message: string, meta?: any) => {
    logger.warn(message, { context: 'integration', ...meta });
  },
};

export const calculationLogger = {
  info: (message: string, meta?: any) => {
    logger.info(message, { context: 'calculation', ...meta });
  },
  error: (message: string, meta?: any) => {
    logger.error(message, { context: 'calculation', ...meta });
  },
};
