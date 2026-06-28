import { useRef } from 'react';
import { MdKeyboardArrowDown } from 'react-icons/md';
import Carousel from '@/components/HomePageCarousel';
import type { CarouselItem } from '@/components/HomePageCarousel';
import { IconContainer } from '@/components/common';
import styles from './HomePage.module.css';

/** 示例工具列表——图片和链接后续自行替换 */
const DEMO_TOOLS: CarouselItem[] = [
  {
    id: 'audioswitch',
    image: '/1.png',
    title: '音频转码',
    subtitle: '各类音频格式转换',
  },
  {
    id: 'pictureswitch',
    image: '/2.png',
    title: '图片转码',
    subtitle: '图片格式与压缩',
  },
  {
    id: 'pancakeworkflow',
    image: '/1.png',
    title: '松饼工作流',
    subtitle: '哎哎给自己搞点小东西',
  },
];

/** GitHub 图标（md 系列无品牌图标，内联 SVG） */
function GitHubIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function HomePage() {
  const secondScreenRef = useRef<HTMLDivElement>(null);

  const scrollToSecond = () => {
    secondScreenRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className={styles.homePage}>
      {/* ====== 首屏 ====== */}
      <div className={styles.homePageTop}>
        {/* 左侧：头像 + 标题 + 介绍 + 外链 */}
        <div className={styles.homePageLeft}>
          <img className={styles.homePageAvatar} src="/1.png" alt="Pancake" draggable={false} />

          <h1 className={styles.homePageTitle}>Pancake 工具箱</h1>

          <p className={styles.homePageIntro}>XXXXXX</p>

          <div className={styles.homePageLinks}>
            <a
              className={styles.homePageLink}
              href=""
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
            >
              <IconContainer size={40} shape="circle" src={<GitHubIcon />} />
            </a>
            <a
              className={styles.homePageLink}
              href=""
              target="_blank"
              rel="noopener noreferrer"
              title="QQ"
            >
              <IconContainer
                size={40}
                shape="circle"
                src={
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12.003 2c-2.265 0-5.258 1.236-5.258 2.904 0 .503.26.96.688 1.357-1.661.653-2.936 2.41-3.323 4.595-.386 2.183-.2 4.13.459 5.436l.337-.27c.157.41.36.825.61 1.225-.245.283-.526.56-.872.853-.453.383-.806.87-.945 1.348-.013.044-.03.087-.04.132-.008.039-.017.077-.023.116-.03.192.016.39.157.53.17.17.44.213.672.127l.003-.003c.81-.283 1.881-1.098 2.72-1.726.596.27 1.245.489 2.014.575 1.217.139 2.39.07 3.46-.075h.003c1.077.145 2.263.212 3.486.075.774-.086 1.426-.306 2.024-.578.838.63 1.912 1.45 2.722 1.735a.58.58 0 00.68-.14.562.562 0 00.148-.544c-.037-.124-.08-.252-.134-.38-.146-.342-.443-.716-.875-1.057-.292-.23-.543-.456-.756-.691.28-.44.51-.9.682-1.35l.286.23c.655-1.306.838-3.253.453-5.436-.386-2.184-1.659-3.94-3.318-4.593.427-.397.685-.854.685-1.359C17.263 3.237 14.27 2 12.003 2z" />
                  </svg>
                }
              />
            </a>
          </div>
        </div>

        {/* 右侧：半圆轮盘 —— 绝对定位紧贴右边缘 */}
        <div className={styles.homePageRight}>
          <div className={styles.homePageCarouselWrap}>
            <Carousel
              items={DEMO_TOOLS}
              radius={160}
              cardWidth={210}
              cardHeight={56}
              imageSize={44}
            />
          </div>
        </div>

        {/* 向下滚动提示 */}
        <div className={styles.scrollHint} onClick={scrollToSecond}>
          <MdKeyboardArrowDown size={20} />
        </div>
      </div>

      {/* ====== 次屏 ====== */}
      <div className={styles.homePageTop2} ref={secondScreenRef}>
        {/* 后续补充功能模块介绍 */}
      </div>
    </main>
  );
}
