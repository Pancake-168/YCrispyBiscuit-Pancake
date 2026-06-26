import { createLogger } from '@/utils/logger';
import MainPageNode from '@/components/MainPageNode/MainPageNode';
const log = createLogger('HomePage.tsx', 'HomePage');

export default function HomePage() {
  log.info('欢迎使用 Pancake 工具箱');

  const image = '';
  const title = '';

  return (
    <main className="HomePage">
      <div className="HomePageTop">
        <div className="HomePageLeft"></div>
        <div className="HomePageRight">
          <MainPageNode image={image} title={title} />
        </div>
      </div>
      <div className="HomePageTop2"></div>
    </main>
  );
}
