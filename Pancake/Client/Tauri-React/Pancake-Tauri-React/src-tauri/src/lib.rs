use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use chrono::Local;
use tauri::{Emitter, Manager};

struct BackendProcess(Mutex<Option<Child>>);

fn kill_backend_processes() {
    // 先尝试 Rust 标准方式
    // （由 Drop 和窗口关闭事件共同触发）
    // 然后用 Windows API 遍历所有 pancake-backend 进程逐个杀
    #[cfg(target_os = "windows")]
    {
        use std::mem;

        unsafe {
            let snap = kernel32::CreateToolhelp32Snapshot(0x00000002, 0); // TH32CS_SNAPPROCESS
            if snap.is_null() {
                return;
            }

            let mut pe: kernel32::PROCESSENTRY32W = mem::zeroed();
            pe.dwSize = mem::size_of::<kernel32::PROCESSENTRY32W>() as u32;

            if kernel32::Process32FirstW(snap, &mut pe) != 0 {
                loop {
                    let name = String::from_utf16_lossy(&pe.szExeFile[..]);
                    let name = name.trim_end_matches('\0');
                    if name.eq_ignore_ascii_case("pancake-backend.exe") {
                        let h = kernel32::OpenProcess(0x0001, 0, pe.th32ProcessID); // PROCESS_TERMINATE
                        if !h.is_null() {
                            kernel32::TerminateProcess(h, 1);
                            kernel32::CloseHandle(h);
                        }
                    }
                    if kernel32::Process32NextW(snap, &mut pe) == 0 {
                        break;
                    }
                }
            }
            kernel32::CloseHandle(snap);
        }
    }
}

impl Drop for BackendProcess {
    fn drop(&mut self) {
        if let Ok(mut guard) = self.0.lock() {
            if let Some(ref mut child) = *guard {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
        kill_backend_processes();
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// ============================================================================
// 前端日志系统
// ============================================================================

/// 确定日志目录，与后端 pancake.be.log 保持一致：
///   开发 → Server/FastAPI/logs/
///   打包 → <安装目录>/data/logs/
fn get_log_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    if cfg!(debug_assertions) {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../../Server/FastAPI")
            .join("logs")
    } else {
        app_handle
            .path()
            .resource_dir()
            .expect("failed to resolve resource dir")
            .join("data")
            .join("logs")
    }
}

/// 日切轮转：如果 pancake.app.log 的最后修改日期不是今天，
/// 将其重命名为 pancake.app.log.{修改日期}，下次写入自动创建新文件。
fn rotate_log_if_needed(log_dir: &PathBuf) {
    let current = log_dir.join("pancake.app.log");
    if !current.exists() {
        return;
    }

    let modified = match fs::metadata(&current).and_then(|m| m.modified()) {
        Ok(t) => t,
        Err(_) => return,
    };

    let modified_date = chrono::DateTime::<chrono::Local>::from(modified)
        .format("%Y-%m-%d")
        .to_string();
    let today = Local::now().format("%Y-%m-%d").to_string();

    if modified_date != today {
        let rotated = log_dir.join(format!("pancake.app.log.{}", modified_date));
        fs::rename(&current, &rotated).ok();
    }
}

#[derive(Debug, serde::Deserialize)]
struct LogEntry {
    level: String,
    file_name: String,
    function_name: String,
    message: String,
    details: Option<Vec<String>>,
}

#[tauri::command]
fn write_log(app_handle: tauri::AppHandle, entry: LogEntry) -> Result<(), String> {
    let log_dir = get_log_dir(&app_handle);
    fs::create_dir_all(&log_dir).map_err(|e| e.to_string())?;

    rotate_log_if_needed(&log_dir);

    let timestamp = Local::now()
        .format("%Y-%m-%dT%H:%M:%S%.3f%:z")
        .to_string();
    let prefix = format!(
        "[Pancake:{}:{}]{}",
        entry.file_name, entry.function_name, entry.message
    );

    let line = match entry.details {
        Some(ref details) if !details.is_empty() => {
            format!(
                "{} [{}] {} {}\n",
                timestamp,
                entry.level.to_uppercase(),
                prefix,
                details.join(" | ")
            )
        }
        _ => format!(
            "{} [{}] {}\n",
            timestamp,
            entry.level.to_uppercase(),
            prefix
        ),
    };

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_dir.join("pancake.app.log"))
        .map_err(|e| e.to_string())?;

    file.write_all(line.as_bytes())
        .map_err(|e| e.to_string())
}

// ============================================================================
// 下载拦截系统
// ============================================================================

/// 确定下载目录，与日志目录同策略：
///   开发 → Server/FastAPI/temp/downloads/（temp/ 已被 gitignore 忽略）
///   打包 → <安装目录>/data/downloads/
fn get_download_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    if cfg!(debug_assertions) {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../../Server/FastAPI/temp")
            .join("downloads")
    } else {
        app_handle
            .path()
            .resource_dir()
            .expect("failed to resolve resource dir")
            .join("data")
            .join("downloads")
    }
}

/// 从候选名称中清洗出合法文件名：
/// 逐字符剔除路径分隔符、Windows 非法字符与控制字符，防止路径逃逸
fn sanitize_filename(raw: &str) -> String {
    let cleaned: String = raw
        .chars()
        .filter(|c| !matches!(c, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|') && !c.is_control())
        .collect();
    // 去首尾空白，并去掉开头的点（避免变成隐藏文件形态）
    cleaned.trim().trim_start_matches('.').to_string()
}

/// 为下载挑选落盘文件名：
/// 优先 WebView2 建议名（含 Content-Disposition / blob 命名），
/// 其次 URL 路径末段，最后用时间戳兜底
fn pick_download_filename(url: &url::Url, destination: &PathBuf) -> String {
    // 候选 1：WebView2 根据响应头/页面提示给出的建议文件名
    if let Some(name) = destination.file_name().and_then(|n| n.to_str()) {
        let cleaned = sanitize_filename(name);
        if !cleaned.is_empty() {
            return cleaned;
        }
    }
    // 候选 2：URL 路径的最后一段
    if let Some(name) = url.path_segments().and_then(|mut segs| segs.next_back()) {
        let cleaned = sanitize_filename(name);
        if !cleaned.is_empty() {
            return cleaned;
        }
    }
    // 兜底：时间戳文件名，避免覆盖已有文件
    format!("download-{}", Local::now().format("%Y%m%d-%H%M%S"))
}

/// 下载事件载荷：下载开始时通知前端文件名
#[derive(Clone, serde::Serialize)]
struct DownloadStartedPayload {
    url: String,
    filename: String,
}

/// 下载事件载荷：下载结束时通知前端真实落盘路径与成败
#[derive(Clone, serde::Serialize)]
struct DownloadFinishedPayload {
    url: String,
    path: Option<String>,
    success: bool,
}

/// 把下载诊断信息写入应用日志（pancake.app.log）与控制台，用于定位下载失败原因
fn log_download(app_handle: &tauri::AppHandle, msg: &str) {
    let dir = get_log_dir(app_handle);
    std::fs::create_dir_all(&dir).ok();
    // 追加写日志文件，失败不影响下载流程
    if let Ok(mut f) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(dir.join("pancake.app.log"))
    {
        let _ = writeln!(f, "[download] {}", msg);
    }
    // 同时打到控制台，方便开发模式即时查看
    eprintln!("[download] {}", msg);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let resource_dir = app
                .path()
                .resource_dir()
                .expect("failed to resolve resource dir");

            #[allow(unused_mut)]
            let mut window_builder = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                if cfg!(debug_assertions) {
                    tauri::WebviewUrl::External(
                        url::Url::parse("http://localhost:1420").unwrap(),
                    )
                } else {
                    tauri::WebviewUrl::App("index.html".into())
                },
            )
            .title("Pancake")
            .inner_size(1000.0, 600.0)
            .min_inner_size(800.0, 500.0)
            // Tauri 在 release 构建下默认禁用 DevTools，
            // 显式开启保证打包后的软件也能用 F12 打开开发者工具
            .devtools(true)
            .decorations(false)
            // 下载拦截：覆盖 webview 内所有 frame（含 iframe）发起的下载，
            // Requested 时把落盘路径改写为应用指定下载目录，返回 true 让 wry
            // 执行 SetHandled(true) 禁用 WebView2 默认下载条，并同步通知前端
            .on_download(|webview, event| match event {
                tauri::webview::DownloadEvent::Requested { url, destination } => {
                    // 计算下载目录并确保其存在
                    let dir = get_download_dir(&webview.app_handle());
                    std::fs::create_dir_all(&dir).ok();
                    // canonicalize 消去路径中的 .. 成分：wry 的 dunce::simplified 只处理 \\?\ 前缀，
                    // 带 .. 的字面路径会原样传给 WebView2 的 SetResultFilePath，先规范化为无歧义绝对路径
                    let canonical_dir = std::fs::canonicalize(&dir).unwrap_or(dir);
                    // 挑选文件名并拼出完整落盘路径
                    let filename = pick_download_filename(&url, destination);
                    let full_path = canonical_dir.join(&filename);
                    // 记录诊断信息：请求 URL、WebView2 建议路径、最终改写路径
                    log_download(
                        &webview.app_handle(),
                        &format!(
                            "requested url={} suggested={} final={}",
                            url,
                            destination.display(),
                            full_path.display()
                        ),
                    );
                    // 通知前端：下载已开始（含文件名，前端以 Toast 展示）。
                    // 事件发送失败不影响下载本身，忽略返回结果
                    let _ = webview.app_handle().emit(
                        "pancake-download-started",
                        DownloadStartedPayload {
                            url: url.to_string(),
                            filename: filename.clone(),
                        },
                    );
                    // 改写目标路径为指定目录
                    *destination = full_path;
                    // 返回 true：允许下载并采用改写后的路径
                    true
                }
                tauri::webview::DownloadEvent::Finished { url, path, success } => {
                    // 记录诊断信息：下载结果与真实路径
                    log_download(
                        &webview.app_handle(),
                        &format!(
                            "finished url={} success={} path={:?}",
                            url, success, path
                        ),
                    );
                    // 事件发送失败不影响下载本身，忽略返回结果
                    let _ = webview.app_handle().emit(
                        "pancake-download-finished",
                        DownloadFinishedPayload {
                            url: url.to_string(),
                            path: path.map(|p| p.to_string_lossy().to_string()),
                            success,
                        },
                    );
                    // Finished 阶段返回值不参与拦截判断，恒 true
                    true
                }
                // DownloadEvent 标记为 non_exhaustive：未知的未来变体直接放行
                _ => true
            });

            #[cfg(not(debug_assertions))]
            {
                let webview_data = resource_dir.join("data").join("EBWebView");
                std::fs::create_dir_all(&webview_data).ok();
                window_builder = window_builder.data_directory(webview_data);
            }

            let window = window_builder.build().expect("failed to build window");
            let app_handle = app.handle().clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { .. } = event {
                    kill_backend_processes();
                    app_handle.exit(0);
                }
            });

            let backend = if cfg!(debug_assertions) {
                let server_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                    .join("../../../../Server/FastAPI");
                let python = server_dir.join(".venv/Scripts/python.exe");
                Command::new(python)
                    .current_dir(&server_dir)
                    .args(["-m", "app.main"])
                    .spawn()
            } else {
                // 后端 exe 放在 bin/ 子目录，不在表层暴露给用户
                let backend_exe = resource_dir.join("bin").join("pancake-backend.exe");
                Command::new(backend_exe).spawn()
            };

            let backend = backend.expect("Failed to start FastAPI backend");
            app.manage(BackendProcess(Mutex::new(Some(backend))));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, write_log])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, _event| {});
}

#[cfg(target_os = "windows")]
mod kernel32 {
    use std::ffi::c_void;

    pub type BOOL = i32;
    pub type HANDLE = *mut c_void;
    pub type DWORD = u32;
    pub type LONG = i32;
    pub type WCHAR = u16;
    pub const MAX_PATH: usize = 260;

    #[allow(non_snake_case)]
    #[repr(C)]
    pub struct PROCESSENTRY32W {
        pub dwSize: DWORD,
        pub cntUsage: DWORD,
        pub th32ProcessID: DWORD,
        pub th32DefaultHeapID: usize,
        pub th32ModuleID: DWORD,
        pub cntThreads: DWORD,
        pub th32ParentProcessID: DWORD,
        pub pcPriClassBase: LONG,
        pub dwFlags: DWORD,
        pub szExeFile: [WCHAR; MAX_PATH],
    }

    #[allow(non_snake_case)]
    extern "system" {
        pub fn CreateToolhelp32Snapshot(dwFlags: DWORD, th32ProcessID: DWORD) -> HANDLE;
        pub fn Process32FirstW(hSnapshot: HANDLE, lppe: *mut PROCESSENTRY32W) -> BOOL;
        pub fn Process32NextW(hSnapshot: HANDLE, lppe: *mut PROCESSENTRY32W) -> BOOL;
        pub fn OpenProcess(
            dwDesiredAccess: DWORD,
            bInheritHandle: BOOL,
            dwProcessId: DWORD,
        ) -> HANDLE;
        pub fn TerminateProcess(hProcess: HANDLE, uExitCode: u32) -> BOOL;
        pub fn CloseHandle(hObject: HANDLE) -> BOOL;
    }
}
