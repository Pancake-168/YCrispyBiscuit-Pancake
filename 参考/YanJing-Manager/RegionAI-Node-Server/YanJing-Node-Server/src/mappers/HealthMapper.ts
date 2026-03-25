export class HealthMapper {
  async selectHealthRaw(): Promise<{ status: string }> {
    try {
      return { status: 'ok' }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      throw new Error(`系统健康检查失败: ${errorMessage}`, { cause: e })
    }
  }
}
