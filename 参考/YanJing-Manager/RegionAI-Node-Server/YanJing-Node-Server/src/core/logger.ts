import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const { combine, timestamp, printf, colorize, errors } = winston.format

// 自定义日志格式
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`
})

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }), // 捕获并打印堆栈信息
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // 控制台输出 (带颜色)
    new winston.transports.Console({
      format: combine(colorize(), logFormat)
    }),
    // 每日轮转文件收集全量日志
    new DailyRotateFile({
      dirname: 'logs',
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d' // 保留14天的日志
    }),
    // 错误日志单独抽离
    new DailyRotateFile({
      dirname: 'logs',
      filename: 'error-%DATE%.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
})
