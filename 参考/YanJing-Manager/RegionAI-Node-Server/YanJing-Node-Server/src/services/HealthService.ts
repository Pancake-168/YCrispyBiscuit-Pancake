import { HealthMapper } from '../mappers/HealthMapper.js'
import type { HealthResponseSchema } from '../schemas/HealthSchema.js'

export class HealthService {
  private readonly healthMapper: HealthMapper

  constructor(mapper?: HealthMapper) {
    this.healthMapper = mapper || new HealthMapper()
  }

  async getHealth(): Promise<HealthResponseSchema> {
    try {
      const data = await this.healthMapper.selectHealthRaw()
      return data // 对应 FastAPI 中的 HealthResponse(**data)
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      throw new Error(`Failed to get health: ${errorMessage}`, { cause: e })
    }
  }
}
