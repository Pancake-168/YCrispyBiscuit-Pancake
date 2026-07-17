/** API 调用统一返回类型 */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; data: null; error: string };
