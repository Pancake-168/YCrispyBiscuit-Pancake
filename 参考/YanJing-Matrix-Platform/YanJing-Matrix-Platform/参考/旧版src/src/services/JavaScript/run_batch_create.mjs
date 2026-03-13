import { batchCreateApplications } from './CreateManyMarketApp.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appsToCreate = [
  { displayName: "应用名称6" },
  { displayName: "应用名称7" },
];

// 执行批量创建并获取结果
const results = await batchCreateApplications(appsToCreate);

// 生成文件名 (使用时间戳)
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, `batch_create_results_${timestamp}.json`);

// 写入文件
try {
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n 结果已成功保存至: ${outputPath}`);
} catch (err) {
  console.error('\n 保存结果文件失败:', err);
}

