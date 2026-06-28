import type { CarouselItem } from '@/components/HomePageCarousel';

/** 示例工具列表——图片和链接后续自行替换 */
const BASE = import.meta.env.BASE_URL;

export const Pancake_Tools: CarouselItem[] = [
  {
    id: 'audioswitch',
    image: `${BASE}1.png`,
    title: '音频转码',
    subtitle: '各类音频格式转换',
  },
  {
    id: 'pictureswitch',
    image: `${BASE}2.png`,
    title: '图片转码',
    subtitle: '图片格式与压缩',
  },
  {
    id: 'pancakeworkflow',
    image: `${BASE}1.png`,
    title: '松饼工作流',
    subtitle: '哎哎给自己搞点小东西',
  },
];