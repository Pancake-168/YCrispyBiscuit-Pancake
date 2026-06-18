use std::process::{Command, Child};
use std::sync::Mutex;
use tauri::Manager;

struct BackendProcess(Mutex<Option<Child>>);

/// 进程退出时（即使崩溃或异常退出），自动杀掉后端子进程。
/// Drop 在栈展开（panic unwind）时也会被调用，比 on_window_event 更可靠。
impl Drop for BackendProcess {
    fn drop(&mut self) {
        if let Ok(mut guard) = self.0.lock() {
            if let Some(ref mut child) = *guard {
                let _ = child.kill();
            }
        }
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // ---------- 创建窗口 ----------
            // 不在 tauri.conf.json 里定义窗口，而是手动创建，
            // 因为需要运行时计算出 WebView2 数据目录的绝对路径。
            let resource_dir = app.path().resource_dir()
                .expect("failed to resolve resource dir");

            #[allow(unused_mut)]
            let mut window_builder = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                if cfg!(debug_assertions) {
                    tauri::WebviewUrl::External(url::Url::parse("http://localhost:1420").unwrap())
                } else {
                    tauri::WebviewUrl::App("index.html".into())
                },
            )
            .title("Pancake")
            .inner_size(1000.0, 600.0)
            .min_inner_size(800.0, 500.0);

            // 打包后把 WebView2 用户数据（localStorage 等）重定向到
            // 安装目录下的 data/EBWebView/，更新软件不丢登录态。
            // 开发模式不设，使用系统默认位置。
            #[cfg(not(debug_assertions))]
            {
                let webview_data = resource_dir.join("data").join("EBWebView");
                std::fs::create_dir_all(&webview_data).ok();
                window_builder = window_builder.data_directory(webview_data);
            }

            window_builder.build().expect("failed to build window");

            // ---------- 启动 Python 后端 ----------

            let backend = if cfg!(debug_assertions) {
                // dev: 调 Python venv
                let server_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                    .join("../../../../Server/FastAPI");
                let python = server_dir.join(".venv/Scripts/python.exe");
                Command::new(python)
                    .current_dir(&server_dir)
                    .args(["-m", "app.main"])
                    .spawn()
            } else {
                // release: 调 sidecar（Tauri NSIS 安装后文件名无 target triple）
                let backend_exe = resource_dir.join("pancake-backend.exe");
                Command::new(backend_exe)
                    .spawn()
            };

            let backend = backend.expect("Failed to start FastAPI backend");
            app.manage(BackendProcess(Mutex::new(Some(backend))));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, _event| {});
}
