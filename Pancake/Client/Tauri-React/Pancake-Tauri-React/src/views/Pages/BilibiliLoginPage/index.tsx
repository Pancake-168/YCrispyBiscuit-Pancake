import { useState, useEffect, useCallback, useRef } from 'react';
import { createLogger } from '@/utils/logger';
import { Button, Textarea, EmptyState, Tabs, IconContainer, toast } from '@/components/common';
import { VscCopy } from 'react-icons/vsc';
import {
  getLoginUrl,
  pollLogin,
  loginByCookie,
  getUserInfo,
  getStoredValues,
  getAcTimeValue,
  listSessions,
  deleteSession,
} from '@/services/Bilibili';
import type { BilibiliPayload } from '@/services/Bilibili';
import styles from './index.module.css';

const log = createLogger('BilibiliLoginPage.tsx', 'BilibiliLoginPage');

// 扫码登录状态机：idle(空闲) / loading(取码中) / waiting(等待扫码) / scanned(已扫码未确认) / expired(过期) / done(登录成功)
type LoginStatus = 'idle' | 'loading' | 'waiting' | 'scanned' | 'expired' | 'done';

export default function BilibiliLoginPage() {
  // ---- 扫码登录状态 ----
  const [loginStatus, setLoginStatus] = useState<LoginStatus>('idle');
  const [qrcodeImage, setQrcodeImage] = useState('');
  const pollTimerRef = useRef<number | null>(null); // 轮询定时器句柄（setTimeout 递归）

  // ---- 会话与数据 ----
  const [sessionId, setSessionId] = useState('');
  const [sessions, setSessions] = useState<string[]>([]);
  const [cookieInput, setCookieInput] = useState('');
  const [cookieLoading, setCookieLoading] = useState(false);

  // ---- 全量数据（照单全收，JSON 展示） ----
  const [userInfo, setUserInfo] = useState<BilibiliPayload | null>(null);
  const [storedValues, setStoredValues] = useState<BilibiliPayload | null>(null);
  const [acTimeValue, setAcTimeValue] = useState<BilibiliPayload | null>(null);

  // ---- 卸载时清掉未完成的轮询定时器 ----
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) window.clearTimeout(pollTimerRef.current);
    };
  }, []);

  /** 拉取用户信息（nav 完整响应） */
  const loadUserInfo = useCallback(async (sid: string) => {
    const result = await getUserInfo(sid);
    if (result.ok) {
      setUserInfo(result.data);
      log.info('获取B站用户信息成功');
    } else {
      log.error('获取B站用户信息失败', result.error);
      toast(result.error ?? '获取用户信息失败', 'error');
    }
  }, []);

  /** 获取登录二维码并开始轮询 */
  const handleGetQr = useCallback(async () => {
    setLoginStatus('loading');
    setQrcodeImage('');
    const result = await getLoginUrl();
    if (!result.ok) {
      log.error('获取二维码失败', result.error);
      toast(result.error ?? '获取二维码失败', 'error');
      setLoginStatus('idle');
      return;
    }
    const key = result.data.qrcode_key as string;
    setQrcodeImage(result.data.qrcode_image as string);
    setLoginStatus('waiting');
    // 开始递归轮询（每 2 秒一次，直到登录成功/过期/失败）
    const tick = async () => {
      const pollResult = await pollLogin(key);
      if (!pollResult.ok) {
        log.error('轮询扫码状态失败', pollResult.error);
        toast(pollResult.error ?? '轮询失败', 'error');
        setLoginStatus('idle');
        return; // 失败即停止轮询
      }
      const status = pollResult.data.status as string;
      if (status === 'waiting') {
        setLoginStatus('waiting');
      } else if (status === 'scanned') {
        setLoginStatus('scanned');
      } else if (status === 'expired') {
        setLoginStatus('expired');
        toast('二维码已过期，请重新获取', 'warn');
        return; // 过期停止轮询
      } else if (status === 'done') {
        setLoginStatus('done');
        const sid = String(pollResult.data.session_id ?? '');
        setSessionId(sid);
        toast('登录成功', 'success');
        void loadUserInfo(sid);
        return; // 登录成功停止轮询
      }
      pollTimerRef.current = window.setTimeout(tick, 2000); // 2 秒后继续轮询
    };
    void tick();
  }, [loadUserInfo]);

  /** 刷新活跃会话列表 */
  const refreshSessions = useCallback(async () => {
    const result = await listSessions();
    if (result.ok) {
      setSessions((result.data.sessions as string[]) ?? []);
    } else {
      log.error('列出会话失败', result.error);
    }
  }, []);

  /** Cookie 登录 */
  const handleCookieLogin = useCallback(async () => {
    if (!cookieInput.trim()) {
      toast('请先粘贴 Cookie 字符串', 'warn');
      return;
    }
    setCookieLoading(true);
    const result = await loginByCookie(cookieInput.trim());
    setCookieLoading(false);
    if (!result.ok) {
      log.error('Cookie登录失败', result.error);
      toast(result.error ?? 'Cookie登录失败', 'error');
      return;
    }
    const sid = String(result.data.session_id ?? '');
    setSessionId(sid);
    setLoginStatus('done');
    toast('Cookie 登录成功', 'success');
    void loadUserInfo(sid);
    void refreshSessions();
  }, [cookieInput, loadUserInfo, refreshSessions]);

  /** 拉取全量存储值 */
  const handleGetStoredValues = useCallback(async () => {
    if (!sessionId) return;
    const result = await getStoredValues(sessionId);
    if (result.ok) {
      setStoredValues(result.data);
      log.info('获取B站存储值成功');
    } else {
      log.error('获取存储值失败', result.error);
      toast(result.error ?? '获取存储值失败', 'error');
    }
  }, [sessionId]);

  /** 拉取 ac_time_value */
  const handleGetAcTimeValue = useCallback(async () => {
    if (!sessionId) return;
    const result = await getAcTimeValue(sessionId);
    if (result.ok) {
      setAcTimeValue(result.data);
      log.info('获取ac_time_value成功');
    } else {
      log.error('获取ac_time_value失败', result.error);
      toast(result.error ?? '获取ac_time_value失败', 'error');
    }
  }, [sessionId]);

  /** 删除当前会话 */
  const handleDeleteSession = useCallback(async () => {
    if (!sessionId) return;
    const result = await deleteSession(sessionId);
    if (result.ok) {
      toast('会话已删除', 'success');
      setSessionId('');
      setLoginStatus('idle');
      setUserInfo(null);
      setStoredValues(null);
      setAcTimeValue(null);
      void refreshSessions();
    } else {
      log.error('删除会话失败', result.error);
      toast(result.error ?? '删除会话失败', 'error');
    }
  }, [sessionId, refreshSessions]);

  // ---- 页面加载时列出已有会话 ----
  // setState 放在 Promise 回调里（与项目内 AudioSwitchPage 等页面的约定一致），
  // 避免在 effect 体内同步 setState 触发级联渲染
  useEffect(() => {
    listSessions().then((result) => {
      if (result.ok) {
        setSessions((result.data.sessions as string[]) ?? []);
      } else {
        log.error('列出会话失败', result.error);
      }
    });
  }, []);

  // ---- 扫码状态对应的提示文字 ----
  const statusText =
    loginStatus === 'loading'
      ? '正在获取二维码...'
      : loginStatus === 'waiting'
        ? '等待扫码（请使用 B 站 APP 扫码）'
        : loginStatus === 'scanned'
          ? '已扫码，请在手机上确认'
          : loginStatus === 'expired'
            ? '二维码已过期'
            : loginStatus === 'done'
              ? '已登录'
              : '';

  return (
    <div className={styles.page}>
      {/* ---- 左右布局：左侧登录卡片，右侧会话信息与 JSON 数据 ---- */}
      <div className={styles.mainRow}>
        {/* ---- 登录方式（Tabs 切换：扫码 / Cookie） ---- */}
        <div className={styles.loginCard}>
          <Tabs
            tabs={[
              {
                id: 'qr',
                label: '扫码登录',
                content: (
                  <div className={styles.loginContent}>
                    {qrcodeImage ? (
                      <IconContainer size={300} src={qrcodeImage} alt="B站登录二维码" />
                    ) : (
                      <EmptyState
                        title="获取二维码后扫码登录"
                        description="点击下方按钮获取 B 站登录二维码"
                      />
                    )}
                    {statusText && <span className={styles.statusText}>{statusText}</span>}
                    <Button
                      variant="primary"
                      loading={loginStatus === 'loading'}
                      onClick={handleGetQr}
                      style={{ width: 200 }}
                    >
                      {qrcodeImage ? '重新获取二维码' : '获取二维码'}
                    </Button>
                  </div>
                ),
              },
              {
                id: 'cookie',
                label: 'Cookie 登录',
                content: (
                  <div className={styles.loginContent}>
                    <Textarea
                      value={cookieInput}
                      onChange={setCookieInput}
                      placeholder="粘贴浏览器里的完整 Cookie 字符串（SESSDATA=xxx; bili_jct=xxx; ...）"
                      rows={6}
                      label="Cookie"
                      className={styles.cookieTextarea}
                    />
                    <Button
                      variant="primary"
                      loading={cookieLoading}
                      onClick={handleCookieLogin}
                      style={{ width: 200 }}
                    >
                      使用 Cookie 登录
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* ---- 右侧：会话信息 + 全量数据 ---- */}
        <div className={styles.dataArea}>
          {/* 会话操作栏 */}
          <div className={styles.sessionBar}>
            <span className={styles.sessionLabel}>当前会话: {sessionId || '无'}</span>
            <div className={styles.sessionActions}>
              <Button variant="secondary" disabled={!sessionId} onClick={handleGetStoredValues}>
                获取存储值
              </Button>
              <Button variant="secondary" disabled={!sessionId} onClick={handleGetAcTimeValue}>
                获取 ac_time_value
              </Button>
              <Button variant="danger" disabled={!sessionId} onClick={handleDeleteSession}>
                删除会话
              </Button>
            </div>
          </div>

          {/* 会话列表（点击切换当前会话） */}
          {sessions.length > 0 && (
            <div className={styles.sessionList}>
              {sessions.map((sid) => (
                <span
                  key={sid}
                  className={sid === sessionId ? styles.sessionChipActive : styles.sessionChip}
                  onClick={() => setSessionId(sid)}
                >
                  {sid}
                </span>
              ))}
            </div>
          )}

          {/* 全量数据 JSON 展示（三个 tab 合并切换，照单全收） */}
          <div className={styles.jsonTabsWrap}>
            <Tabs
              defaultTab="stored"
              tabs={[
                {
                  id: 'user',
                  label: '用户信息',
                  content: userInfo ? (
                    <JsonSection title="用户信息 (nav 完整响应)" data={userInfo} />
                  ) : (
                    <EmptyState title="暂无用户信息" description="登录后自动获取" />
                  ),
                },
                {
                  id: 'stored',
                  label: '存储值',
                  content: storedValues ? (
                    <JsonSection title="存储值 (stored-values 全量聚合)" data={storedValues} />
                  ) : (
                    <EmptyState title="暂无存储值" description="点击上方「获取存储值」按钮获取" />
                  ),
                },
                {
                  id: 'ac',
                  label: 'ac_time_value',
                  content: acTimeValue ? (
                    <JsonSection title="ac_time_value (含页面变量)" data={acTimeValue} />
                  ) : (
                    <EmptyState
                      title="暂无 ac_time_value"
                      description="点击上方「获取 ac_time_value」按钮获取"
                    />
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 全量 JSON 展示块：数据原样序列化，不筛选字段；标题行带复制按钮 */
function JsonSection({ title, data }: { title: string; data: BilibiliPayload }) {
  // 序列化文本同时用于展示和复制，保证两者一致
  const jsonText = JSON.stringify(data, null, 2);

  // 复制完整 JSON 到剪贴板（与展示内容完全一致）
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      toast('已复制到剪贴板', 'success');
    } catch (e) {
      log.error('复制JSON失败', e);
      toast('复制失败', 'error');
    }
  }, [jsonText]);

  return (
    <div className={styles.jsonBlock}>
      <div className={styles.jsonHeader}>
        <span className={styles.jsonTitle}>{title}</span>
        <Button
          variant="subtle"
          icon={<IconContainer size={14} src={<VscCopy size={14} />} />}
          onClick={handleCopy}
        >
          复制
        </Button>
      </div>
      <pre className={styles.jsonView}>{jsonText}</pre>
    </div>
  );
}
