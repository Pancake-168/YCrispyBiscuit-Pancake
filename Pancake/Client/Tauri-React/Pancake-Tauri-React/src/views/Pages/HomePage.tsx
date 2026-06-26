import { FaGithub } from 'react-icons/fa';
import { Carousel } from '@/components/common';
import type { CarouselItem } from '@/components/common';

/** 示例工具列表——图片和链接后续自行替换 */
const DEMO_TOOLS: CarouselItem[] = [
  {
    id: 'audioswitch',
    image: '/1.png',
    title: '音频切换',
    subtitle: '多设备音频路由管理',
  },
  {
    id: 'pictureswitch',
    image: '/2.png',
    title: '图片切换',
    subtitle: '批量图片格式与压缩',
  },
  {
    id: 'pancakeworkflow',
    image: '/1.png',
    title: '工作流',
    subtitle: '可视化任务编排引擎',
  },
  {
    id: 'demo',
    image: '/2.png',
    title: '演示页',
    subtitle: '组件与功能展示',
  },
  {
    id: 'tool5',
    image: '/1.png',
    title: '工具五',
    subtitle: '功能描述占位',
  },
  {
    id: 'tool6',
    image: '/2.png',
    title: '工具六',
    subtitle: '功能描述占位',
  },
];

export default function HomePage() {
  return (
    <main className="HomePage">
      {/* ====== 首屏 ====== */}
      <div className="HomePageTop">
        {/* 左侧：头像 + 标题 + 介绍 + 外链 */}
        <div className="HomePageLeft">
          <img
            className="HomePageAvatar"
            src="/1.png"
            alt="Pancake"
            draggable={false}
          />

          <h1 className="HomePageTitle">Pancake 工具箱</h1>

          <p className="HomePageIntro">XXXXXX</p>

          <div className="HomePageLinks">
            <a
              className="HomePageLink"
              href=""
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
            >
              <FaGithub size={22} />
            </a>
            <a
              className="HomePageLink"
              href=""
              target="_blank"
              rel="noopener noreferrer"
              title="QQ"
            >
              {/* QQ 图标——暂用 SVG 占位，可自行替换为实际图标 */}
              <svg
                width={22}
                height={22}
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12.003 2c-2.265 0-5.258 1.236-5.258 2.904 0 .503.26.96.688 1.357-1.661.653-2.936 2.41-3.323 4.595-.386 2.183-.2 4.13.459 5.436l.337-.27c.157.41.36.825.61 1.225-.245.283-.526.56-.872.853-.453.383-.806.87-.945 1.348-.013.044-.03.087-.04.132-.008.039-.017.077-.023.116-.03.192.016.39.157.53.17.17.44.213.672.127l.003-.003c.81-.283 1.881-1.098 2.72-1.726.596.27 1.245.489 2.014.575 1.217.139 2.39.07 3.46-.075h.003c1.077.145 2.263.212 3.486.075.774-.086 1.426-.306 2.024-.578.838.63 1.912 1.45 2.722 1.735a.58.58 0 00.68-.14.562.562 0 00.148-.544c-.037-.124-.08-.252-.134-.38-.146-.342-.443-.716-.875-1.057-.292-.23-.543-.456-.756-.691.28-.44.51-.9.682-1.35l.286.23c.655-1.306.838-3.253.453-5.436-.386-2.184-1.659-3.94-3.318-4.593.427-.397.685-.854.685-1.359C17.263 3.237 14.27 2 12.003 2z" />
              </svg>
            </a>
          </div>
        </div>

        {/* 右侧：半圆轮盘 —— 绝对定位紧贴右边缘 */}
        <div className="HomePageRight">
          <div className="HomePageCarouselWrap">
            <Carousel items={DEMO_TOOLS} radius={160} cardWidth={210} cardHeight={56} imageSize={44} />
          </div>
        </div>
      </div>

      {/* ====== 次屏 ====== */}
      <div className="HomePageTop2">
        {/* 后续补充功能模块介绍 */}
      </div>
    </main>
  );
}
