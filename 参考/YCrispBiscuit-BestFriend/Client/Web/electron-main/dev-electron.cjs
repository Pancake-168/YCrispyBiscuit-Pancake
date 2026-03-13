const http = require('http');

const VITE_URL =  'http://localhost:5174';
const ELECTRON_CMD = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const ELECTRON_ARGS = ['electron', '.'];

let electronProc = null;

function waitForServer(url, timeout = 120000, interval = 500) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, res => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          resolve();
        } else {
            if (Date.now() - start > timeout) reject(new Error('Timeout waiting for dev server'));
            else setTimeout(check, interval);
        }
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) reject(new Error('Timeout waiting for dev server'));
        else setTimeout(check, interval);
      });
      req.setTimeout(3000, () => req.destroy());
    };
    check();
  });
}

function startElectron() {
  console.log('Starting Electron...');
  const env = { ...process.env, NODE_ENV: 'development' };
  const openFlag = (process.env.ELECTRON_OPEN_DEVTOOLS === 'true') ? 'true' : 'false';
  const mergedEnv = { ...env, ELECTRON_OPEN_DEVTOOLS: openFlag };
  electronProc = require('child_process').spawn(ELECTRON_CMD, ELECTRON_ARGS, {
    shell: true,
    stdio: 'inherit',
    env: mergedEnv,
    windowsHide: true
  });
  electronProc.on('exit', code => {
    console.log('Electron exited with', code);
    process.exit(code === null ? 0 : code);
  });
}

function shutdown() {
  console.log('Shutting down...');
  if (electronProc && !electronProc.killed) {
    try { electronProc.kill(); } catch {}
  }
  setTimeout(() => process.exit(0), 200);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

(async () => {
  try {
    await waitForServer(VITE_URL);
    console.log('Dev server is up:', VITE_URL);
    startElectron();
  } catch (err) {
    console.error('Failed to detect dev server:', err.message || err);
    shutdown();
    process.exit(1);
  }
})();