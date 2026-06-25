import { createLogger } from '@/utils/logger';

const log = createLogger('ContentPage.tsx', 'ContentPage');

export default function ContentPage() {
  log.info('进入内容页');

  return (
    <main className="ContentPage">
      <h1>内容页</h1>
      <p>这里是内容区域</p>
    </main>
  );
}
