/**
 * 后端统一错误响应解析。
 *
 * 后端异常体系（app/exceptions/handlers.py）对 AppError / HTTPException 返回
 * { detail, request_id }，其中 FastAPI 422 校验错误的 detail 是数组。
 * 此函数从非 2xx 响应体中提取用户可读的具体错误原因，
 * 解析失败时回退 HTTP 状态码（如网关错误页不是 JSON）。
 */

/** 从非 2xx 响应中提取后端错误文案 */
export async function readHttpError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown };
    // AppError / HTTPException：detail 是字符串（如"不支持的目标格式: xxx"）
    if (typeof body.detail === 'string' && body.detail) {
      return body.detail;
    }
    // FastAPI 422 校验错误：detail 是 [{ loc, msg, type }, ...] 数组，取第一条 msg
    if (Array.isArray(body.detail) && body.detail.length > 0) {
      const first = body.detail[0] as { msg?: unknown };
      if (typeof first?.msg === 'string' && first.msg) {
        return first.msg;
      }
    }
  } catch {
    // 响应体不是 JSON 时忽略，走状态码兜底
  }
  return `HTTP ${res.status}`;
}
