export interface FunctionItem {
  title: string;
  image: string;
  detail: string;
}

export const functionList: FunctionItem[] = [
  {
    title: '图片格式转换',
    image: '/1.jpg',
    detail: '支持 JSON / YAML / XML / CSV 互相转换',
  },
  {
    title: '音频格式转换',
    image: '/2.jpg',
    detail: '文本与 Base64 互转，支持 UTF-8 编码',
  },
];
