import { VscError } from 'react-icons/vsc';
import { EmptyState, Button } from '@/components/common';
import { useNavigate } from 'react-router-dom';
import styles from './404NotFound.module.css';

/**
 * 404 — 路由未匹配时的回退页面。
 */
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      <EmptyState
        icon={<VscError size={48} />}
        title="页面不存在"
        description="请检查网址是否正确"
        action={
          <Button variant="primary" onClick={() => navigate('/', { replace: true })}>
            返回首页
          </Button>
        }
      />
    </div>
  );
}
