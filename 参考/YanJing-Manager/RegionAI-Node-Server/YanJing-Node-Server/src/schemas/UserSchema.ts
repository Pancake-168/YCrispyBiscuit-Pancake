import { z } from '@hono/zod-openapi'

export const UserCreateSchemaObj = z
  .object({
    username: z.string().min(1, 'Username is required').openapi({
      example: 'admin'
    }),
    email: z.string().email('Invalid email').openapi({
      example: 'admin@example.com'
    })
  })
  .openapi('UserCreateSchema')

export const UserResponseSchemaObj = z
  .object({
    id: z.number().openapi({ example: 1 }),
    username: z.string().openapi({ example: 'admin' }),
    email: z.string().email().openapi({ example: 'admin@example.com' })
  })
  .openapi('UserResponseSchema')

export type UserCreateSchema = z.infer<typeof UserCreateSchemaObj>
export type UserResponseSchema = z.infer<typeof UserResponseSchemaObj>
