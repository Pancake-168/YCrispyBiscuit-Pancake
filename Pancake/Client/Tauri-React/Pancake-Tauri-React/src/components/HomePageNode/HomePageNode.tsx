import { IconContainer } from '../common';

interface HomePageNodeProps {
  image: string;
  title: string;
}

/**
 * 节点：
 * 由一张图片+标题组成
 */
export default function HomePageNode({ image, title }: HomePageNodeProps) {
  return (
    <div className="">
      <IconContainer size={64} shape="rounded" src={image} alt={title} />
      <span className="">{title}</span>
    </div>
  );
}
