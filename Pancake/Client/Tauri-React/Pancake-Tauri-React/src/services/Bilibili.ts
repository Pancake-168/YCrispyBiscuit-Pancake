import { createLogger } from '@/utils/logger'; // 前端日志工具
import { API_URLS } from '@/ApiUrls'; // 集中管理的 API 端点 URL
import type { ApiResult } from '@/types/ApiResult'; // 统一 API 返回包装类型（ok/data/error）
import { readHttpError } from '@/utils/http'; // 从非 2xx 响应中提取后端具体错误文案

// ============================================================================
// 类型说明（照单全收）
// B站接口返回什么就拿什么：所有响应按全量 JSON 透传，不声明业务字段类型。
// ============================================================================

/** 全量透传响应：结构不设限，前端按 JSON 原样展示 */
export type BilibiliPayload = Record<string, unknown>;

// ============================================================================
// API 调用
// ============================================================================

/** GET /api/bilibili/login/url — 获取扫码登录二维码（含 qrcode_key/url/qrcode_image） */
export async function getLoginUrl(): Promise<ApiResult<BilibiliPayload>> {
  const log = createLogger('Bilibili.ts', 'getLoginUrl'); // 带上下文的 logger
  let error: string | undefined;
  try {
    const res = await fetch(API_URLS.getBilibiliLoginUrl(), {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as BilibiliPayload;
      return { ok: true, data };
    }
    error = await readHttpError(res); // 取后端具体错误
  } catch (e) {
    log.error('获取B站登录二维码失败', e);
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? '获取B站登录二维码失败' };
}

/** GET /api/bilibili/login/poll — 轮询扫码状态（waiting/scanned/done/expired） */
export async function pollLogin(qrcodeKey: string): Promise<ApiResult<BilibiliPayload>> {
  const log = createLogger('Bilibili.ts', 'pollLogin');
  let error: string | undefined;
  try {
    const res = await fetch(API_URLS.pollBilibiliLogin(qrcodeKey), {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as BilibiliPayload;
      return { ok: true, data };
    }
    error = await readHttpError(res);
  } catch (e) {
    log.error('轮询扫码状态失败', e);
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? '轮询扫码状态失败' };
}

/** POST /api/bilibili/login/cookie — 用 Cookie 字符串登录，返回 session_id */
export async function loginByCookie(cookie: string): Promise<ApiResult<BilibiliPayload>> {
  const log = createLogger('Bilibili.ts', 'loginByCookie');
  let error: string | undefined;
  try {
    const res = await fetch(API_URLS.loginBilibiliByCookie(), {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ cookie }),
    });
    if (res.ok) {
      const data = (await res.json()) as BilibiliPayload;
      return { ok: true, data };
    }
    error = await readHttpError(res);
  } catch (e) {
    log.error('Cookie登录失败', e);
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? 'Cookie登录失败' };
}

/** GET /api/bilibili/user — 获取用户信息（nav 完整响应） */
export async function getUserInfo(sessionId: string): Promise<ApiResult<BilibiliPayload>> {
  const log = createLogger('Bilibili.ts', 'getUserInfo');
  let error: string | undefined;
  try {
    const res = await fetch(API_URLS.getBilibiliUserInfo(sessionId), {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as BilibiliPayload;
      return { ok: true, data };
    }
    error = await readHttpError(res);
  } catch (e) {
    log.error('获取B站用户信息失败', e);
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? '获取B站用户信息失败' };
}

/** GET /api/bilibili/stored-values — 获取全量存储值（cookies/token/nav/指纹/页面变量） */
export async function getStoredValues(sessionId: string): Promise<ApiResult<BilibiliPayload>> {
  const log = createLogger('Bilibili.ts', 'getStoredValues');
  let error: string | undefined;
  try {
    const res = await fetch(API_URLS.getBilibiliStoredValues(sessionId), {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as BilibiliPayload;
      return { ok: true, data };
    }
    error = await readHttpError(res);
  } catch (e) {
    log.error('获取B站存储值失败', e);
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? '获取B站存储值失败' };
}

/** GET /api/bilibili/ac-time-value — 获取 ac_time_value 与页面变量 */
export async function getAcTimeValue(sessionId: string): Promise<ApiResult<BilibiliPayload>> {
  const log = createLogger('Bilibili.ts', 'getAcTimeValue');
  let error: string | undefined;
  try {
    const res = await fetch(API_URLS.getBilibiliAcTimeValue(sessionId), {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as BilibiliPayload;
      return { ok: true, data };
    }
    error = await readHttpError(res);
  } catch (e) {
    log.error('获取ac_time_value失败', e);
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? '获取ac_time_value失败' };
}

/** GET /api/bilibili/sessions — 列出所有活跃会话 ID */
export async function listSessions(): Promise<ApiResult<BilibiliPayload>> {
  const log = createLogger('Bilibili.ts', 'listSessions');
  let error: string | undefined;
  try {
    const res = await fetch(API_URLS.listBilibiliSessions(), {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as BilibiliPayload;
      return { ok: true, data };
    }
    error = await readHttpError(res);
  } catch (e) {
    log.error('列出B站会话失败', e);
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? '列出B站会话失败' };
}

/** DELETE /api/bilibili/session — 删除指定会话 */
export async function deleteSession(sessionId: string): Promise<ApiResult<BilibiliPayload>> {
  const log = createLogger('Bilibili.ts', 'deleteSession');
  let error: string | undefined;
  try {
    const res = await fetch(API_URLS.deleteBilibiliSession(sessionId), {
      method: 'DELETE',
      headers: { accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as BilibiliPayload;
      return { ok: true, data };
    }
    error = await readHttpError(res);
  } catch (e) {
    log.error('删除B站会话失败', e);
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? '删除B站会话失败' };
}
