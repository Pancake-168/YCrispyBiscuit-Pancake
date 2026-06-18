use std::{fs, path::Path};

fn main() {
    // GNU 工具链下 WebView2Loader.dll 是动态链接的，需要打包进安装器。
    // resources 保留目录结构，所以这里把 dll 复制到 src-tauri/ 扁平路径，
    // 这样 tauri.conf.json 里 resources: ["WebView2Loader.dll"] 就能把 dll 放到 exe 旁边。
    let dll_src = Path::new("target/release/WebView2Loader.dll");
    let dll_dst = Path::new("WebView2Loader.dll");
    if dll_src.exists() {
        let _ = fs::copy(dll_src, dll_dst);
    }

    tauri_build::build()
}
