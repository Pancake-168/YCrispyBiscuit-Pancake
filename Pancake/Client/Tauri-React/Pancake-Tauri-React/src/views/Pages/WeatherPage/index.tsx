import { useState, useEffect, useMemo } from 'react';
import { createLogger } from '@/utils/logger';
import { Input, Select, Skeleton, EmptyState, toast } from '@/components/common';
import { getWeatherList, getWeather } from '@/services/Weather';
import type { WeatherDailyItem, WeatherPayload } from '@/services/Weather';
import styles from './index.module.css';

const log = createLogger('WeatherPage.tsx', 'WeatherPage');

// 下拉最多展示条数（2400+ 城市全量塞进 Radix Select 会卡）
const MAX_OPTIONS = 200;

/** 把 "2026/07/31" 转成 "7月31日 周五" */
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('/').map(Number);
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][
    new Date(y, m - 1, d).getDay()
  ];
  return `${m}月${d}日 ${week}`;
}

/** 单日预报卡片 */
function DailyCard({ item }: { item: WeatherDailyItem }) {
  return (
    <div className={styles.dayCard}>
      <div className={styles.dayDate}>{formatDate(item.date)}</div>
      <div className={styles.dayWeather}>{item.dayText}</div>
      <div className={styles.dayTemp}>
        <span className={styles.tempHigh}>{Math.round(item.high)}°</span>
        <span className={styles.tempLow}>{Math.round(item.low)}°</span>
      </div>
      <div className={styles.dayWind}>
        {item.dayWindDirection} {item.dayWindScale}
      </div>
    </div>
  );
}

export default function WeatherPage() {
  log.info('进入天气页');

  // 城市列表（[站点 id, 城市名称]）
  const [cities, setCities] = useState<[string, string][]>([]);
  // 搜索关键字
  const [keyword, setKeyword] = useState('');
  // 选中的站点 id
  const [selectedId, setSelectedId] = useState('');
  // 天气数据（后端包装解包后的 WeatherPayload）
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  // 加载状态
  const [loadingList, setLoadingList] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // 首次进入：拉取城市列表，默认选中第一个
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      const res = await getWeatherList();
      if (cancelled) return;
      if (res.ok) {
        const list = res.data.cities;
        setCities(list);
        if (list.length > 0) setSelectedId("58457");
      } else {
        toast(res.error ?? '获取城市列表失败', 'error');
      }
      setLoadingList(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 按关键字过滤城市（名称或站点 id 均可匹配）
  const cityOptions = useMemo(() => {
    const kw = keyword.trim();
    const matched = kw
      ? cities.filter(([id, name]) => name.includes(kw) || id.includes(kw))
      : cities;
    return matched.slice(0, MAX_OPTIONS).map(([id, name]) => ({ value: id, label: name }));
  }, [cities, keyword]);

  // 选中城市后拉取 7 天天气
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    (async () => {
      setLoadingWeather(true);
      const res = await getWeather(selectedId);
      if (cancelled) return;
      if (res.ok) {
        setWeather(res.data);
      } else {
        toast(res.error ?? '获取天气失败', 'error');
        setWeather(null);
      }
      setLoadingWeather(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const payload = weather?.data;
  const location = payload?.location;
  const now = payload?.now;
  const daily = payload?.daily ?? [];

  return (
    <div className={styles.page}>
      {/* 顶部：搜索框 + 城市下拉 */}
      <div className={styles.controls}>
        <Input
          value={keyword}
          onChange={setKeyword}
          placeholder="输入城市名或站点 ID 搜索…"
          className={styles.searchInput}
        />
        <div className={styles.selectWrap}>
          <Select
            value={selectedId}
            onChange={setSelectedId}
            options={cityOptions}
            placeholder="选择城市"
            label="城市"
          />
        </div>
      </div>

      {/* 城市列表加载中 */}
      {loadingList && (
        <div className={styles.loading}>
          <Skeleton variant="rect" height={90} count={1} />
          <Skeleton variant="rect" height={150} count={1} />
        </div>
      )}

      {/* 当前天气卡片 */}
      {!loadingList && location && now && (
        <div className={styles.currentCard}>
          <div className={styles.currentLeft}>
            <div className={styles.cityName}>{location.name}</div>
            <div className={styles.cityPath}>{location.path}</div>
          </div>
          <div className={styles.currentTemp}>{Math.round(now.temperature)}°</div>
          <div className={styles.currentRight}>
            <span>体感 {Math.round(now.feelst)}°</span>
            <span>
              {now.windDirection} {now.windScale}
            </span>
            <span>湿度 {Math.round(now.humidity)}%</span>
          </div>
        </div>
      )}

      {/* 天气数据加载中 */}
      {!loadingList && loadingWeather && (
        <div className={styles.loading}>
          <Skeleton variant="rect" height={90} count={1} />
          <Skeleton variant="rect" height={150} count={1} />
        </div>
      )}

      {/* 7 天预报 */}
      {!loadingList && !loadingWeather && daily.length > 0 && (
        <div className={styles.forecastGrid}>
          {daily.map((item) => (
            <DailyCard key={item.date} item={item} />
          ))}
        </div>
      )}

      {/* 无数据空状态 */}
      {!loadingList && !loadingWeather && daily.length === 0 && (
        <EmptyState title="暂无天气数据" description="请确认后端服务已启动，或尝试切换城市" />
      )}
    </div>
  );
}
