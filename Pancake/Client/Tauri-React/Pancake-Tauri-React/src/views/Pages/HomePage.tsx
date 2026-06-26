import { createLogger } from '@/utils/logger';

const log = createLogger('HomePage.tsx', 'HomePage');

export default function HomePage() {
  log.info('欢迎使用 Pancake 工具箱');


  /**
   * 首页设计，左侧 标志性主页面logo + 标题 + 说明性介绍/简介，可以添加外链接：github、QQ
   * 右侧 主要功能入口，功能模块的入口按钮
   * 
   * 左侧+右侧需要在首屏Top展示，Top2是次屏的内容，主要是一些功能模块的介绍和说明
   * 
   * 
   * 设计：
   * 一、左侧logo直接采用public/1.jpg，标题就命名为“Pancake工具箱”，介绍暂且“XXXXXX”，后面我会补充，下方接着俩icon，分别是github和QQ，空出链接，我会自己填
   * 二、右侧主要功能入口，我想设计成贴近右边缘的半圆形循环展示，所有的工具全都作为半圆形轨迹上的一个节点，每个节点具备标题和icon，icon后面我会自己填加，所有工具平分整个圆环（但实际上只露出左半圆，因为右半圆看不到）。
   * 三、圆环具备切换，上下俩三角icon，意思是顺时针、逆时针，每次只切换一个功能，就是一个轮盘一样的，默认看到的就位于“时钟9点钟”的位置。
   * 
   * 四、次屏与首屏之间的切换需要滑动磁铁，滑动超出一半范畴自动吸附至该屏展示全部。
   * 五、首屏底部有一个向下切换的提示，意思是告诉用户下方还有内容。
   * 六、每屏默认100vh除去TauriBar的剩余部分全占满，如果是web端没有TauriBar，就默认100vh
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
