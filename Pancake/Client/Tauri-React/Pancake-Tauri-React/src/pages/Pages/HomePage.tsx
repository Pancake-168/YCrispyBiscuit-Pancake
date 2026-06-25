import { createLogger } from '@/utils/logger';

const log = createLogger('HomePage.tsx', 'HomePage');

export default function HomePage() {
  log.info('欢迎使用 Pancake 工具箱');


  /**
   * 首页设计，左侧 标志性主页面logo + 标题 + 说明性介绍/简介，可以添加外链接：github、QQ
   * 右侧 主要功能入口，功能模块的入口按钮
   * 
   * 左侧+右侧需要在首屏Top展示，Top2是首页的下方内容，主要是一些功能模块的介绍和说明
   */
  return (
    <main className="HomePage">
      <div className="HomePageTop">
        <div className="HomePageLeft">

        </div>
        <div className="HomePageRight">
        </div>
      </div>
      <div className="HomePageTop2">
      </div>

    </main >
  );
}
