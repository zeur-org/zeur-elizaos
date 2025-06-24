import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = './logs';
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'zeur-yield-optimizer' },
    transports: [
        // Write all logs to file
        new winston.transports.File({
            filename: process.env.LOG_FILE || './logs/agent.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        // Write errors to separate file
        new winston.transports.File({
            filename: './logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// If we're not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                return `${timestamp} [${level}]: ${message} ${
                    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
                }`;
            })
        )
    }));
} 