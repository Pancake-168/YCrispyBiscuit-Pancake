use std::{fs, path::Path};

fn main() {
    // GNU 工具链下 WebView2Loader.dll 是动态链接的，需要打包进安装器。
    // resources 保留目录结构，所以这里把 dll 复制到 src-tauri/ 扁平路径，
    // 这样 tauri.conf.json 里 resources: ["WebView2Loader.dll"] 就能把 dll 放到 exe 旁边。
    let dll_src = Path::new("target/release/WebView2Loader.dll");
    let dll_dst = Path::new("WebView2Loader.dll");
    if dll_src.exists() {
        let _ = fs::copy(dll_src, dll_dst);
    } else {
        // MSVC 等静态链接场景：DLL 在 webview2-com-sys 构建输出中，需要搜出来复制到 src-tauri/
        let arch = match std::env::var("CARGO_CFG_TARGET_ARCH").as_deref() {
            Ok("aarch64") => "arm64",
            Ok("x86") => "x86",
            _ => "x64",
        };
        let mut found = false;
        for profile in ["release", "debug"] {
            if let Ok(entries) = fs::read_dir(Path::new("target").join(profile).join("build")) {
                for entry in entries.flatten() {
                    if entry.file_name().to_string_lossy().starts_with("webview2-com-sys") {
                        let candidate = entry.path().join("out").join(arch).join("WebView2Loader.dll");
                        if candidate.exists() {
                            let _ = fs::copy(&candidate, dll_dst);
                            found = true;
                            break;
                        }
                    }
                }
            }
            if found { break; }
        }
        // 兜底：首次构建或 cargo clean 后 webview2-com-sys 还未编译，创建空文件避免 resources 校验报错
        if !found {
            let _ = fs::write(dll_dst, []);
        }
    }

    tauri_build::build()
}
