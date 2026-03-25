import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { logger as honoLogger } from 'hono/logger'
import { cors } from 'hono/cors'
import { config } from './core/config.js'
import { globalErrorHandler, notFoundHandler } from './exceptions/handlers.js'
import { requestIdMiddleware } from './middlewares/request_id.js'
import apiRouter from './api/router.js'

const app = new OpenAPIHono()

// 全局中间件
app.use('*', cors({
  origin: '*', // 允许所有来源 (如果需要携带 Cookie 请改为 `origin: (origin) => origin` 并设置 `credentials: true`)
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))
app.use('*', honoLogger())
app.use('*', requestIdMiddleware)

// API 文档输出 (类似 FastAPI 的 /docs)
app.doc('/api/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'RegionAI Node Server API',
    description: 'API documentation aligned with FastAPI specs'
  }
})
app.get('/docs', swaggerUI({ url: '/api/openapi.json' }))

// 路由挂载 (对应 FastAPI 的 app.include_router)
app.route('/api', apiRouter)

// 异常与 404 处理
app.onError(globalErrorHandler)
app.notFound(notFoundHandler)

serve(
  {
    fetch: app.fetch,
    port: config.port
  },
  (info) => {
    console.log(`____RegionAI-Node-Server is running on ${info.port} ____`)
  }
)
