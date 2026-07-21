import { useState, useEffect, useCallback } from 'react';
import { createLogger } from '@/utils/logger';
import { Button, IconContainer, ScrollArea, EmptyState, Skeleton, toast } from '@/components/common';
import { VscFolder, VscFolderOpened, VscRefresh, VscFolderLibrary } from 'react-icons/vsc';
import { getMMDWorkflow, openAllMMDFolders, openSingleMMDFolder } from '@/services/PCmethods';
import type { PCmethodsWorkflow } from '@/services/PCmethods';
import styles from './index.module.css';

const log = createLogger('PancakeWorkFlowPage.tsx', 'PancakeWorkFlowPage');

export default function PancakeWorkFlowPage() {
  const [workflows, setWorkflows] = useState<PCmethodsWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    const result = await getMMDWorkflow();
    if (result.ok && result.data) {
      setWorkflows([result.data]);
      log.info('获取工作流数据成功');
    } else {
      toast('获取工作流数据失败', 'error');
      log.error('获取工作流数据失败', result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      const result = await getMMDWorkflow();
      if (ignore) return;
      if (result.ok && result.data) {
        setWorkflows([result.data]);
        log.info('获取工作流数据成功');
      } else {
        toast('获取工作流数据失败', 'error');
        log.error('获取工作流数据失败', result.error);
      }
      setLoading(false);
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenAll = useCallback(async (workflowName: string) => {
    setActionLoading(workflowName);
    const result = await openAllMMDFolders();
    if (result.ok) {
      toast('已打开所有文件夹', 'success');
    } else {
      toast('打开文件夹失败', 'error');
    }
    setActionLoading(null);
  }, []);

  const handleOpenSingle = useCallback(async (folderName: string) => {
    setActionLoading(folderName);
    const result = await openSingleMMDFolder(folderName);
    if (result.ok) {
      toast(`已打开: ${folderName}`, 'success');
    } else {
      toast('打开文件夹失败', 'error');
    }
    setActionLoading(null);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>松饼</h1>
        <Button
          variant="subtle"
          icon={<IconContainer size={14} src={<VscRefresh size={14} />} />}
          loading={loading}
          onClick={fetchWorkflows}
        >
          刷新
        </Button>
      </div>

      {loading ? (
        <div className={styles.skeletonGroup}>
          <Skeleton variant="rect" width="100%" height={200} />
        </div>
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={<IconContainer size={48} src={<VscFolderLibrary size={48} />} />}
          title="暂无工作流"
          description="点击刷新按钮获取工作流配置"
          action={
            <Button variant="primary" icon={<IconContainer size={14} src={<VscRefresh size={14} />} />} onClick={fetchWorkflows}>
              刷新
            </Button>
          }
        />
      ) : (
        <ScrollArea maxHeight={520}>
          <div className={styles.workflowList}>
            {workflows.map((workflow) => (
              <section key={workflow.name} className={styles.workflowCard}>
                <div className={styles.workflowHeader}>
                  <div className={styles.workflowNameRow}>
                    <VscFolderOpened size={20} className={styles.workflowIcon} />
                    <h2 className={styles.workflowName}>{workflow.name}</h2>
                  </div>
                  <Button
                    variant="secondary"
                    loading={actionLoading === workflow.name}
                    loadingText="打开中..."
                    onClick={() => handleOpenAll(workflow.name)}
                  >
                    打开全部（{workflow.folder.length}）
                  </Button>
                </div>
                <div className={styles.folderList}>
                  {workflow.folder.map((folder) => (
                    <div key={folder.name} className={styles.folderItem}>
                      <VscFolder size={18} className={styles.folderIcon} />
                      <div className={styles.folderInfo}>
                        <span className={styles.folderName}>{folder.name}</span>
                        <span className={styles.folderPath}>{folder.path}</span>
                      </div>
                      <Button
                        variant="subtle"
                        loading={actionLoading === folder.name}
                        loadingText="..."
                        onClick={() => handleOpenSingle(folder.name)}
                      >
                        打开
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
