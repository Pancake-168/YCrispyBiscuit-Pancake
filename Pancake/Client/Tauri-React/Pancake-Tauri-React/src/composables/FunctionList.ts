import type { CarouselItem } from '@/components/HomePageCarousel';

/** 示例工具列表——图片和链接后续自行替换 */
const BASE = import.meta.env.BASE_URL;

export const Pancake_Tools: CarouselItem[] = [
  {
    id: 'audio_switch',
    image: `${BASE}1.png`,
    title: '音频转码',
    subtitle: '各类音频格式转换',
  },
  {
    id: 'picture_switch',
    image: `${BASE}2.png`,
    title: '图片转码',
    subtitle: '图片格式与压缩',
  },
  {
    id: 'pancake_workflow',
    image: `${BASE}3.png`,
    title: '松饼工作流',
    subtitle: '便捷工具',
  },
  {
    id: 'weather',
    image: `${BASE}1.png`,
    title: '天气查询',
    subtitle: '天天都需要你猜，你的变化有多快~',
  },
  {
    id: 'bilibili_login',
    image: `${BASE}2.png`,
    title: '哔哩哔哩登录信息获取',
    subtitle: '天天都需要你猜，你的变化有多快~',
  },
  {
    id: 'web_embed',
    image: `${BASE}3.png`,
    title: 'AI 助手',
    subtitle: '内嵌本地 AI 对话',
  },
];
