import { useRef, useState, useEffect, useMemo } from 'react';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { VscGithub } from 'react-icons/vsc';
import { SiQq } from 'react-icons/si';
import Carousel from '@/components/HomePageCarousel';
import { Pancake_Tools } from '@/composables/FunctionList';
import { IconContainer } from '@/components/common';
import { isTauri } from '@/utils/isTauri';
import { useThemeStore } from '@/stores/theme.store';
import styles from './HomePage.module.css';

export default function HomePage() {
  const secondScreenRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(window.innerWidth / 100);
  const prevTheme = useRef(useThemeStore.getState().theme);

  useEffect(() => {
    const prev = prevTheme.current;
    document.documentElement.setAttribute('data-theme', 'dark');
    return () => {
      document.documentElement.setAttribute('data-theme', prev);
    };
  }, []);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth / 100);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scrollToSecond = () => {
    secondScreenRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const tools = useMemo(
    () => (!isTauri() ? Pancake_Tools.filter((t) => t.id !== 'pancakeworkflow') : Pancake_Tools),
    [],
  );

  const sizes = useMemo(() => {
    // 面板宽 = clamp(280px, 32%, 500px)，和 CSS .homePageRight 同步
    const panelWidth = Math.max(280, Math.min(500, Math.round(vw * 32)));
    const radius = Math.round(panelWidth * 0.44);
    const cardWidth = Math.round(panelWidth * 0.58);
    const cardHeight = Math.round(panelWidth * 0.156);
    const imageSize = Math.round(panelWidth * 0.122);
    // 头像 = clamp(120px, 13vw, 300px)
    const avatarSize = Math.max(120, Math.min(300, Math.round(vw * 13)));
    const iconSize = Math.round(panelWidth * 0.111);
    const iconInner1 = Math.round(iconSize * 0.75);
    const iconInner2 = Math.round(iconSize * 0.55);
    const scrollIcon = Math.round(panelWidth * 0.056);
    return {
      avatarSize,
      iconSize,
      iconInner1,
      iconInner2,
      radius,
      cardWidth,
      cardHeight,
      imageSize,
      scrollIcon,
    };
  }, [vw]);

  return (
    <main className={styles.homePage}>
      {/* ====== 首屏 ====== */}
      <div className={styles.homePageTop}>
        {/* 左侧：头像 + 标题 + 介绍 + 外链 */}
        <div className={styles.homePageLeft}>
          <IconContainer
            className={styles.homePageAvatar}
            size={sizes.avatarSize}
            shape="circle"
            src={`${import.meta.env.BASE_URL}3.jpg`}
            alt="Pancake"
          />

          <h1 className={styles.homePageTitle}>Pancake工具箱</h1>

          <p className={styles.homePageIntro}>你好，你不好，我好，我也不好</p>

          <div className={styles.homePageLinks}>
            <a
              className={styles.homePageLink}
              href="https://github.com/Pancake-168"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
            >
              <IconContainer
                size={sizes.iconSize}
                shape="circle"
                src={<VscGithub size={sizes.iconInner1} />}
              />
            </a>
            <a
              className={styles.homePageLink}
              href="https://qm.qq.com/q/VeEWEMqdaM"
              target="_blank"
              rel="noopener noreferrer"
              title="依酥饼"
            >
              <IconContainer
                size={sizes.iconSize}
                shape="circle"
                src={<SiQq size={sizes.iconInner2} />}
              />
            </a>
          </div>
        </div>

        {/* 右侧：半圆轮盘 —— 绝对定位紧贴右边缘 */}
        <div className={styles.homePageRight}>
          <div className={styles.homePageCarouselWrap}>
            <Carousel
              items={tools}
              radius={sizes.radius}
              cardWidth={sizes.cardWidth}
              cardHeight={sizes.cardHeight}
              imageSize={sizes.imageSize}
            />
          </div>
        </div>

        {/* 向下滚动提示 */}
        <div className={styles.scrollHint} onClick={scrollToSecond}>
          <MdKeyboardArrowDown size={sizes.scrollIcon} />
        </div>
      </div>

      {/* ====== 次屏 ====== */}
      <div className={styles.homePageTop2} ref={secondScreenRef}>
        {/* 后续补充功能模块介绍 */}
      </div>
    </main>
  );
}
