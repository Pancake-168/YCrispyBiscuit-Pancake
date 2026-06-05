import { useState } from "react";

const API_BASE = "http://localhost:8080/api/bilibili";

function BilibiliTest() {
  // QR Login
  const [qrcodeKey, setQrcodeKey] = useState("");
  const [qrcodeUrl, setQrcodeUrl] = useState("");
  const [pollMsg, setPollMsg] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [qrLoading, setQrLoading] = useState(false);

  // Cookie Login
  const [cookieInput, setCookieInput] = useState("");

  // Results
  const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(null);
  const [storedValues, setStoredValues] = useState<Record<string, unknown> | null>(null);
  const [acTimeValue, setAcTimeValue] = useState<Record<string, unknown> | null>(null);

  const [error, setError] = useState("");

  const sid = () => sessionId;

  async function getLoginUrl() {
    setError("");
    setQrLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login/url`);
      const data = await res.json();
      setQrcodeKey(data.qrcode_key);
      setQrcodeUrl(data.qrcode_image);
      setPollMsg("请扫码");
    } catch (e) {
      setError(String(e));
    }
    setQrLoading(false);
  }

  async function pollLogin() {
    if (!qrcodeKey) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/login/poll?qrcode_key=${qrcodeKey}`);
      const data = await res.json();
      setPollMsg(data.message || data.status);
      if (data.status === "done" && data.session_id) {
        setSessionId(data.session_id);
        setPollMsg("登录成功！session_id: " + data.session_id);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  async function cookieLogin() {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/login/cookie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: cookieInput }),
      });
      const data = await res.json();
      setSessionId(data.session_id);
    } catch (e) {
      setError(String(e));
    }
  }

  async function fetchUserInfo() {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/user?session_id=${sid()}`);
      setUserInfo(await res.json());
    } catch (e) {
      setError(String(e));
    }
  }

  async function fetchStoredValues() {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/stored-values?session_id=${sid()}`);
      setStoredValues(await res.json());
    } catch (e) {
      setError(String(e));
    }
  }

  async function fetchAcTimeValue() {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/ac-time-value?session_id=${sid()}`);
      setAcTimeValue(await res.json());
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, fontFamily: "monospace" }}>
      <h2>Bilibili API Test</h2>

      {error && (
        <div style={{ color: "red", background: "#fee", padding: 8, marginBottom: 12, borderRadius: 4, whiteSpace: "pre-wrap" }}>
          {error}
        </div>
      )}

      {/* QR Login */}
      <section style={sectionStyle}>
        <h3>1. 扫码登录</h3>
        <button onClick={getLoginUrl} disabled={qrLoading}>
          {qrLoading ? "获取中..." : "获取二维码"}
        </button>
        {qrcodeUrl && (
          <div style={{ marginTop: 8 }}>
            <img src={qrcodeUrl} alt="QR" style={{ border: "1px solid #ccc", width: 200, height: 200 }} />
            <br />
            <button onClick={pollLogin} style={{ marginTop: 8 }}>轮询登录状态</button>
            <span style={{ marginLeft: 8 }}>{pollMsg}</span>
          </div>
        )}
      </section>

      {/* Cookie Login */}
      <section style={sectionStyle}>
        <h3>2. Cookie 登录</h3>
        <textarea
          value={cookieInput}
          onChange={(e) => setCookieInput(e.target.value)}
          placeholder="粘贴完整的 Cookie 字符串..."
          rows={3}
          style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }}
        />
        <br />
        <button onClick={cookieLogin} style={{ marginTop: 8 }}>Cookie 登录</button>
      </section>

      {/* Session */}
      <section style={sectionStyle}>
        <h3>3. 当前 Session</h3>
        <input
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="session_id"
          style={{ width: 200, fontFamily: "monospace" }}
        />
      </section>

      {/* Query buttons */}
      <section style={sectionStyle}>
        <h3>4. 查询</h3>
        <button onClick={fetchUserInfo} style={{ marginRight: 8 }}>用户信息</button>
        <button onClick={fetchStoredValues} style={{ marginRight: 8 }}>所有存储值</button>
        <button onClick={fetchAcTimeValue}>ac_time_value</button>
      </section>

      {/* Results */}
      {userInfo && (
        <section style={sectionStyle}>
          <h3>用户信息</h3>
          <pre style={preStyle}>{JSON.stringify(userInfo, null, 2)}</pre>
        </section>
      )}

      {storedValues && (
        <section style={sectionStyle}>
          <h3>存储值</h3>
          <pre style={preStyle}>{JSON.stringify(storedValues, null, 2)}</pre>
        </section>
      )}

      {acTimeValue && (
        <section style={sectionStyle}>
          <h3>ac_time_value</h3>
          <pre style={preStyle}>{JSON.stringify(acTimeValue, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
  background: "#fafafa",
};

const preStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 4,
  padding: 12,
  fontSize: 12,
  overflow: "auto",
  maxHeight: 400,
};

export default BilibiliTest;
