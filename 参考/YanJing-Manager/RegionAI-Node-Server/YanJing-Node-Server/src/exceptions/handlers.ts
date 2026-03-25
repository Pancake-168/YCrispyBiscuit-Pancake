import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { Result } from '../utils/Result.js'
import { BusinessException } from './BusinessException.js'
import { logger } from '../core/logger.js'

// 模拟 FastAPI 中的各类底层异常映射
export const globalErrorHandler = (err: Error, c: Context) => {
  const rid = c.get('requestId') || '-'
  const reqInfo = `[${rid}] ${c.req.method} ${c.req.path}`

  // 1. Zod 类型校验异常 (模拟 RequestValidationError 422)
  if (err.name === 'ZodError') {
    logger.warn(`ValidationError ${reqInfo} -> ${err.message}`)
    // @ts-expect-error ZodError issues dynamically bound
    return c.json(Result.error(err.issues, 422), 422)
  }

  // 2. 拦截我们自定义的业务异常 (模拟 ValueError / 数据库 Integrity 等)
  if (err instanceof BusinessException) {
    logger.warn(`BusinessException ${reqInfo} -> ${err.message}`)
    const status = (err.statusCode || 400) as ContentfulStatusCode
    return c.json(Result.error(err.message, err.errorCode || 400), status)
  }

  // 3. 拦截 Hono 框架自带的 HTTP 异常 (权限、找不到等 401 403 404)
  if (err instanceof HTTPException) {
    logger.warn(`HTTPException ${reqInfo} -> ${err.message}`)
    return c.json(Result.error(err.message, err.status), err.status)
  }

  // 4. Node.js 自带的一些原生异常映射体系 (完全对标你的 Python FastAPI)
  if (err.name === 'TimeoutError') {
    logger.warn(`TimeoutError ${reqInfo}`)
    return c.json(Result.error('Request timeout', 408), 408)
  }

  // 5. 类似 MySQL 等数据库连接错误 (OperationalError) / 网关错误
  if (err.message.includes('ECONNREFUSED') || err.name === 'ConnectionError') {
    logger.error(`ConnectionError ${reqInfo} -> ${err.message}`)
    return c.json(Result.error('Bad gateway: upstream service failure', 502), 502)
  }

  // 其他未预料到的系统异常 (兜底 500 处理)
  logger.error(`UnhandledException ${reqInfo} -> ${err.name}: ${err.message}\n${err.stack}`)

  const isDev = process.env.NODE_ENV !== 'production'
  const message = isDev ? err.message : 'Internal Server Error'

  return c.json(Result.error(message, 500), 500)
}

// 404 处理 (覆盖默认的 404 文本响应)
export const notFoundHandler = (c: Context) => {
  const rid = c.get('requestId') || '-'
  logger.warn(`FileNotFoundError [${rid}] ${c.req.method} ${c.req.path} -> Route not found`)
  return c.json(Result.error('Not Found', 404), 404)
}
