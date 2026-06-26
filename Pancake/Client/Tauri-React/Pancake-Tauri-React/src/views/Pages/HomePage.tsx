import { createLogger } from '@/utils/logger';

const log = createLogger('HomePage.tsx', 'HomePage');

export default function HomePage() {
  log.info('欢迎使用 Pancake 工具箱');

  return (
    <main className="HomePage">
      <div className="HomePageTop">
        <div className="HomePageLeft"></div>
        <div className="HomePageRight">
        </div>
      </div>
      <div className="HomePageTop2"></div>
    </main>
  );
}
