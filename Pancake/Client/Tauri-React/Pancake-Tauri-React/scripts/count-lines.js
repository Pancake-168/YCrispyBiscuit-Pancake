import fs from 'node:fs';
import path from 'node:path';

// 默认统计的扩展名（前端 + 后端常用源码类型）
const DEFAULT_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.html',
  '.json',
  '.py',
  '.vue'
]);

// 默认跳过目录（缓存/依赖/构建产物/日志等不算代码）
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.venv',
  'venv',
  'dist',
  'build',
  '__pycache__',
  '.ruff_cache',
  'logs',
  'data',
]);

// 从命令行读取目标目录：第一个参数
const root = process.argv[2];

// 解析 --ext 参数：例如 --ext .ts,.tsx
const extArgIndex = process.argv.indexOf('--ext');
let exts = DEFAULT_EXTS;
if (extArgIndex >= 0 && process.argv[extArgIndex + 1]) {
  // 按逗号切分用户传入的扩展名，并补全缺失的前导点
  exts = new Set(
    process.argv[extArgIndex + 1]
      .split(',')
      .map((ext) => ext.trim())
      .filter(Boolean)
      .map((ext) => (ext.startsWith('.') ? ext : `.${ext}`)),
  );
}

if (!root) {
  console.error('用法: node scripts/count-lines.js <目录> [--ext .ts,.tsx]');
  process.exit(1);
}

/**
 * 统计单个文件的行数。
 * 这里统计物理行数，空行和注释行也会被算进去。
 */
function countLines(filePath) {
  // 以 utf8 读取文件内容；部分文件可能含特殊编码，按普通文本处理即可
  const content = fs.readFileSync(filePath, 'utf8');
  // 按换行符拆分后计算数组长度，兼容 Windows 的 \r\n
  return content.split(/\r?\n/).length;
}

/**
 * 递归统计目录：返回 { files, lines, byExt }。
 */
function walk(dir) {
  let files = 0;
  let lines = 0;
  // 按扩展名分组，方便最后输出明细
  const byExt = new Map();

  // 读取目录中的每一项
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    // 目录：跳过依赖/产物目录，否则继续递归
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const result = walk(fullPath);
      files += result.files;
      lines += result.lines;
      for (const [ext, count] of result.byExt) {
        byExt.set(ext, (byExt.get(ext) ?? 0) + count);
      }
      continue;
    }

    // 非普通文件（符号链接等）不统计
    if (!entry.isFile()) continue;

    // 只统计指定扩展名
    const ext = path.extname(entry.name);
    if (!exts.has(ext)) continue;

    const fileLines = countLines(fullPath);
    files += 1;
    lines += fileLines;
    byExt.set(ext, (byExt.get(ext) ?? 0) + fileLines);
  }

  return { files, lines, byExt };
}

// 解析成绝对路径后再递归，避免相对路径导致输出误导
const targetDir = path.resolve(root);

// 目录不存在时直接报错退出
if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
  console.error(`目录不存在或不是文件夹: ${targetDir}`);
  process.exit(1);
}

// 开始统计
const result = walk(targetDir);

console.log(`目录: ${targetDir}`);
console.log('---');
console.log(`文件数: ${result.files}`);
console.log(`行数:   ${result.lines}`);
console.log('---');
console.log('按扩展名:');
// 按行数从高到低展示各扩展名统计
for (const [ext, count] of [...result.byExt.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`${ext}: ${count}`);
}
