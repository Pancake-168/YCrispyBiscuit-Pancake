use std::process::{Command, Child};
use std::sync::Mutex;
use tauri::Manager;

struct BackendProcess(Mutex<Option<Child>>);

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
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
                // release: 调打包好的 pancake-backend.exe (sidecar)
                let resource_dir = app.path().resource_dir()
                    .expect("failed to resolve resource dir");
                let backend_exe = resource_dir.join("pancake-backend.exe");
                Command::new(backend_exe)
                    .spawn()
            };

            let backend = backend.expect("Failed to start FastAPI backend");
            app.manage(BackendProcess(Mutex::new(Some(backend))));
            Ok(())
        })
        .on_window_event(|handle, event| {
            if let tauri::WindowEvent::Destroyed = event {
                if let Some(state) = handle.try_state::<BackendProcess>() {
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(ref mut child) = *guard {
                            let _ = child.kill();
                        }
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
