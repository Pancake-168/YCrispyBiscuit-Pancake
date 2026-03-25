import { z } from '@hono/zod-openapi'

export const HealthResponseSchemaObj = z
  .object({
    status: z.string().openapi({ example: 'ok' })
  })
  .openapi('HealthResponseSchema')

export type HealthResponseSchema = z.infer<typeof HealthResponseSchemaObj>
