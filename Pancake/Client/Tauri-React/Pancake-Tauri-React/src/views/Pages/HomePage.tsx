import { createLogger } from '@/utils/logger';

const log = createLogger('HomePage.tsx', 'HomePage');

export default function HomePage() {
  log.info('欢迎使用 Pancake 工具箱');

  /**
   * 首页设计，左侧 标志性主页面头像 + 标题 + 说明性介绍/简介，可以添加外链接：github、QQ
   * 右侧 主要功能入口，功能模块的入口按钮
   *
   * 左侧+右侧需要在首屏Top展示，Top2是次屏的内容，主要是一些功能模块的介绍和说明
   *
   *
   * 设计：
   * 一、左侧头像直接采用public/1.jpg，标题就命名为“Pancake工具箱”，介绍暂且“XXXXXX”，后面我自己会补充，下方接着俩icon，分别是github和QQ，空出链接，我会自己填
   * 二、右侧主要功能入口，我想设计成贴近右边缘的半圆形循环展示，所有的工具全都作为半圆形轨迹上的一个节点，每个节点具备标题和图片，图片后面我会自己填加。
   * 三、圆环具备切换，上下俩三角icon，意思是顺时针、逆时针，每次只切换一个功能，就是一个轮盘一样的，默认位于“时钟9点钟”的位置永久被高亮。
   *     这个具体怎么实现呢？大概就是一个常规的轮播图架构的形式，就比如一个竖着的轮播图，将其以中间那个为原点，上下离原点越远，相对偏移越大，遵循圆环规则。
   *     假设中心那个节点距离右边缘为R（也就是半径），轮播图默认展示5个节点，且两端具备渐变消失。半圆环也就是180°，5个节点4个间隔，每个间隔45°，刚好是一个方便计算的数字。
   *     从上到下展示出来的5个节点标号为A2、A1、A0、A-1、A-2，A2和A-2就紧贴右边缘，A0距离右边缘R，A1和A-1距离右边缘的位置就是（R-R/根号2），以此计算出X值。
   *     Y值则需要另行计算，Y值基本上就是距离A0的纵向距离，A2和A-2一定是R，A1和A-1一定是（R/根号2）
   *     两个箭头icon位于圆环内部，同样紧贴页面右边缘，但位置不依照圆环坐标系来进行间接计算。
   *
   * 四、次屏与首屏之间的切换需要滑动磁铁，滑动超出一半范畴自动吸附至该屏展示全部。
   * 五、首屏底部有一个向下切换的提示，意思是告诉用户下方还有内容。
   * 六、每屏默认100vh除去TauriBar的剩余部分全占满，如果是web端没有TauriBar，就默认100vh
   */
  return (
    <main className="HomePage">
      <div className="HomePageTop">
        <div className="HomePageLeft"></div>
        <div className="HomePageRight"></div>
      </div>
      <div className="HomePageTop2"></div>
    </main>
  );
}
