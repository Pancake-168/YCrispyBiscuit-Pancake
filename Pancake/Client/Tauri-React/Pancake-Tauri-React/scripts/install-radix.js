import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const packages = [
  '@radix-ui/react-dialog',
  '@radix-ui/react-alert-dialog',
  '@radix-ui/react-popover',
  '@radix-ui/react-tooltip',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-context-menu',
  '@radix-ui/react-menubar',
  '@radix-ui/react-select',
  '@radix-ui/react-hover-card',
  '@radix-ui/react-toast',
  '@radix-ui/react-switch',
  '@radix-ui/react-checkbox',
  '@radix-ui/react-radio-group',
  '@radix-ui/react-slider',
  '@radix-ui/react-tabs',
  '@radix-ui/react-accordion',
  '@radix-ui/react-collapsible',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-navigation-menu',
  '@radix-ui/react-aspect-ratio',
  '@radix-ui/react-progress',
  '@radix-ui/react-avatar',
  '@radix-ui/react-toggle',
  '@radix-ui/react-label',
  '@radix-ui/react-separator',
  '@radix-ui/react-visually-hidden',
  '@radix-ui/react-slot',
];

const child = spawn('npm', ['install', ...packages], {
  stdio: 'inherit',
  shell: true,
  cwd: rootDir,
});

child.on('exit', (code) => {
  if (code === 0) {
    console.log('\nRadix UI 全部安装完成');
  } else {
    console.error(`\n安装失败，退出码: ${code}`);
  }
  process.exit(code || 0);
});
