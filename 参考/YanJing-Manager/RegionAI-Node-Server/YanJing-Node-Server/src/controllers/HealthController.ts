import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { HealthService } from '../services/HealthService.js'
import { HealthResponseSchemaObj } from '../schemas/HealthSchema.js'
import { createResultSchema, Result, ErrorResultSchema } from '../utils/Result.js'

export const router = new OpenAPIHono()
const service = new HealthService()

const healthRoute = createRoute({
  method: 'get',
  path: '/',
  summary: '健康检查接口',
  description:
    '检测服务运行状态 (对应 FastAPI router.get("/health", response_model=HealthResponse))',
  tags: ['Health'],
  responses: {
    200: {
      description: '健康检查成功',
      content: {
        'application/json': {
          schema: createResultSchema(HealthResponseSchemaObj)
        }
      }
    },
    500: {
      description: '服务器内部错误',
      content: {
        'application/json': {
          schema: ErrorResultSchema
        }
      }
    }
  }
})

router.openapi(healthRoute, async (c) => {
  try {
    const data = await service.getHealth()
    return c.json(Result.success(data))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    return c.json(Result.error(message, 500), 500)
  }
})
