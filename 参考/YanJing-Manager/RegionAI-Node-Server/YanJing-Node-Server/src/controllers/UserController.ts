import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { UserService } from '../services/UserService.js'
import { createResultSchema, Result, ErrorResultSchema } from '../utils/Result.js'
import { UserResponseSchemaObj } from '../schemas/UserSchema.js'
import { BusinessException } from '../exceptions/BusinessException.js'

export const router = new OpenAPIHono()
const userService = new UserService()

const listUsersRoute = createRoute({
  method: 'get',
  path: '/list',
  summary: '获取所有用户',
  tags: ['Users'],
  responses: {
    200: {
      description: '成功返回用户列表',
      content: {
        'application/json': {
          schema: createResultSchema(z.array(UserResponseSchemaObj))
        }
      }
    }
  }
})

router.openapi(listUsersRoute, async (c) => {
  const users = await userService.getAllUsers()
  return c.json(Result.success(users))
})

const getUserByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  summary: '根据ID获取用户',
  tags: ['Users'],
  request: {
    params: z.object({
      id: z.coerce.number().openapi({ description: '用户的唯一ID', example: 1 })
    })
  },
  responses: {
    200: {
      description: '成功找到用户',
      content: {
        'application/json': {
          schema: createResultSchema(UserResponseSchemaObj)
        }
      }
    },
    400: {
      description: '参数错误',
      content: { 'application/json': { schema: ErrorResultSchema } }
    },
    404: {
      description: '用户不存在',
      content: { 'application/json': { schema: ErrorResultSchema } }
    }
  }
})

router.openapi(getUserByIdRoute, async (c) => {
  const { id } = c.req.valid('param')
  const user = await userService.getUserById(id)

  if (!user) {
    throw new BusinessException(404, 'User not found')
  }

  return c.json(Result.success(user))
})
