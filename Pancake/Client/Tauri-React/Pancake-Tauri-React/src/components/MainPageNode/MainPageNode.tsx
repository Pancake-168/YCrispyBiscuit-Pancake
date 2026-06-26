import { IconContainer } from '../common';

interface MainPageNodeProps {
  image: string;
  title: string;
}

/**
 * 节点：
 * 由一张图片+标题组成
 */
export default function MainPageNode({ image, title }: MainPageNodeProps) {
  return (
    <div className="">
      <IconContainer size={64} shape="rounded" src={image} alt={title} />
      <span className="">{title}</span>
    </div>
  );
}
