import { createLogger } from '@/utils/logger';
import { API_URLS } from '@/ApiUrls';
import type { ApiResult } from '@/types/ApiResult';
import { readHttpError } from '@/utils/http';

// 城市列表项：[站点 id, 城市名称]
export type WeatherCity = [string, string];

// GET /api/weather/list 的业务数据（后端 WeatherResponse.data）
export interface WeatherListData {
  cities: WeatherCity[];
}

// 单个城市天气响应中的 location 信息（字段来自 CMA weather/view 接口）
export interface WeatherLocation {
  id: string;
  name: string;
  path: string;
  longitude: number;
  latitude: number;
  timezone: number;
}

// 当前实况（CMA now）
export interface WeatherNow {
  precipitation: number;
  temperature: number;
  pressure: number;
  humidity: number;
  windDirection: string;
  windDirectionDegree: number;
  windSpeed: number;
  windScale: string;
  feelst: number;
}

// 单日预报（CMA daily，共 7 条）
export interface WeatherDailyItem {
  date: string;
  high: number;
  dayText: string;
  dayCode: number;
  dayWindDirection: string;
  dayWindScale: string;
  low: number;
  nightText: string;
  nightCode: number;
  nightWindDirection: string;
  nightWindScale: string;
}

// GET /api/weather?id=xxx 的业务数据（后端 WeatherResponse.data）
export interface WeatherPayload {
  msg: string;
  code: number;
  data: {
    location: WeatherLocation;
    now: WeatherNow;
    daily: WeatherDailyItem[];
    // jieQi / alarm / lastUpdate 等字段页面暂不使用
    [key: string]: unknown;
  };
}

// 获取天气支持的城市 id+名称 列表
export async function getWeatherList(): Promise<ApiResult<WeatherListData>> {
  const log = createLogger('Weather.ts', 'getWeatherList');
  let error: string | undefined;
  try {
    log.info('开始获取天气城市列表');
    const res = await fetch(API_URLS.getWeatherList(), {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    if (res.ok) {
      // 后端为统一响应包装 { success, data }，这里只取 data 业务数据
      const json = (await res.json()) as { success: boolean; data: WeatherListData };
      log.info('获取天气城市列表成功');
      return { ok: true, data: json.data };
    }
    error = await readHttpError(res);
  } catch (e) {
    log.error('获取天气城市列表失败', e);
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? '获取天气城市列表失败' };
}

// 获取单个城市天气
export async function getWeather(id: string): Promise<ApiResult<WeatherPayload>> {
  const log = createLogger('Weather.ts', 'getWeather');
  let error: string | undefined;
  try {
    log.info('开始获取城市天气', id);
    const res = await fetch(API_URLS.getWeather(id), {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    if (res.ok) {
      // 后端为统一响应包装 { success, data }，这里只取 data 业务数据
      const json = (await res.json()) as { success: boolean; data: WeatherPayload };
      log.info('获取城市天气成功', id);
      return { ok: true, data: json.data };
    }
    error = await readHttpError(res);
  } catch (e) {
    log.error('获取城市天气失败', e);
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? '获取城市天气失败' };
}
