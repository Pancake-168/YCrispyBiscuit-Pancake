use std::process::{Command, Child};
use std::sync::Mutex;
use tauri::Manager;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
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
        pub fn OpenProcess(dwDesiredAccess: DWORD, bInheritHandle: BOOL, dwProcessId: DWORD) -> HANDLE;
        pub fn TerminateProcess(hProcess: HANDLE, uExitCode: u32) -> BOOL;
        pub fn CloseHandle(hObject: HANDLE) -> BOOL;
    }
}
