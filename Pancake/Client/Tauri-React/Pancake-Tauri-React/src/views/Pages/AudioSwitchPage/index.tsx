import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createLogger } from '@/utils/logger';
import { isTauri } from '@/utils/isTauri';
import { formatFileSize, formatDuration } from '@/utils/file';
import {
  Button,
  IconContainer,
  Select,
  ScrollArea,
  EmptyState,
  Skeleton,
  toast,
} from '@/components/common';
import {
  convertAudio,
  getFormats,
  filterSupportedFiles,
  getSingleDownloadUrl,
  getBatchDownloadUrl,
} from '@/services/AudioSwitch';
import type { FormatsResponse, ConvertResultItem } from '@/services/AudioSwitch';
import styles from './index.module.css';
import {
  VscAdd,
  VscTrash,
  VscCloudDownload,
  VscWarning,
  VscCheck,
  VscFileMedia,
} from 'react-icons/vsc';

const log = createLogger('AudioSwitchPage.tsx', 'AudioSwitchPage');

interface FileItem {
  id: string; // 内置 File 没有唯一标识，自增生成
  file: File; // 原始文件对象（提交转换用）
  name: string; // 文件名
  size: number; // 文件大小（字节）
  format: string; // 前端提取的扩展名（小写去点）
}

// 转换状态机：'idle'（空闲）/ 'converting'（转换中）/ 'done'（完成）
type ConvertStatus = 'idle' | 'converting' | 'done';

export default function AudioSwitchPage() {
  // ---- 从后端获取的格式数据（input_formats 是文件过滤唯一数据源） ----
  const [formatsData, setFormatsData] = useState<FormatsResponse | null>(null);

  // ---- 文件列表 ----
  const [files, setFiles] = useState<FileItem[]>([]);
  const fileIdCounter = useRef(0);

  // ---- 转换参数（只有目标格式一项） ----
  const [targetFormat, setTargetFormat] = useState('mp3');

  // ---- 转换状态与结果 ----
  const [status, setStatus] = useState<ConvertStatus>('idle');
  const [results, setResults] = useState<ConvertResultItem[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);

  // ---- 拖拽 ----
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // ---- 点击选择（Tauri 原生对话框 + Web <input> 回退） ----
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- 支持扩展名（来自后端，过滤与 accept 属性共用） ----
  const supportedExtensions = useMemo(() => formatsData?.input_formats ?? [], [formatsData]);

  // ---- <input> accept 属性，与 Tauri 原生对话框 filter 一致 ----
  const inputAccept = useMemo(() => {
    if (supportedExtensions.length === 0) return 'audio/*';
    return supportedExtensions.map((e) => `.${e}`).join(',');
  }, [supportedExtensions]);

  // ---- 启动时拉取格式列表 ----
  useEffect(() => {
    getFormats().then((result) => {
      if (result.ok) {
        setFormatsData(result.data);
        log.info('获取音频格式数据:', result.data.input_formats);
      } else {
        log.error('获取音频格式列表失败', result.error);
        toast('无法获取支持的格式列表', 'error');
      }
    });
  }, []);

  // ---- 格式选择器的选项 ----
  const formatOptions = useMemo(() => {
    if (!formatsData) return [];
    return formatsData.output_formats.map((f) => ({ value: f, label: f }));
  }, [formatsData]);

  /**
   * 文件操作
   */
  // 添加文件：先经过前端过滤（扩展名白名单 + 200MB 上限），再进列表
  const addFiles = useCallback(
    (newFiles: File[]) => {
      const { valid, rejected } = filterSupportedFiles(newFiles, supportedExtensions);
      if (rejected.length > 0) {
        toast(
          `已过滤 ${rejected.length} 个不支持的文件: ${rejected.map((r) => r.name).join(', ')}`,
          'warn',
        );
      }
      const items: FileItem[] = valid.map((f) => {
        const id = `f-${++fileIdCounter.current}`; // 自增唯一 ID
        const ext = f.name.split('.').pop()?.toLowerCase() || ''; // 提取小写扩展名
        return { id, file: f, name: f.name, size: f.size, format: ext };
      });
      setFiles((prev) => [...prev, ...items]);
      // 添加文件后重置转换状态，结果和任务 ID 一并清空
      setStatus('idle');
      setResults([]);
      setTaskId(null);
      log.info(`添加 ${items.length} 个文件，当前共 ${files.length + items.length} 个`);
    },
    [files.length, supportedExtensions],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id)); // 按 id 过滤移除
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setResults([]);
    setStatus('idle');
    setTaskId(null);
  }, []);

  // 拖拽放下：取 dataTransfer 里的文件列表交给 addFiles
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length > 0) addFiles(dropped);
    },
    [addFiles],
  );

  // 点击选择：Tauri 走原生对话框读取字节，Web 回退隐藏 <input> click
  const handleClickSelect = useCallback(() => {
    if (isTauri()) {
      import('@tauri-apps/plugin-dialog')
        .then(({ open }) =>
          open({
            multiple: true,
            filters: [{ name: '音频', extensions: supportedExtensions }],
          }),
        )
        .then(async (selected) => {
          if (!selected) return;
          const paths = Array.isArray(selected) ? selected : [selected];
          if (paths.length === 0) return;
          const { readFile } = await import('@tauri-apps/plugin-fs');
          const newFiles: File[] = [];
          for (const filePath of paths) {
            try {
              const bytes = await readFile(filePath); // 读取文件字节
              const name = filePath.split(/[\\/]/).pop() || 'unknown'; // 提取文件名
              newFiles.push(new File([bytes], name));
            } catch (err) {
              log.warn('读取文件失败', { path: filePath, error: String(err) });
            }
          }
          if (newFiles.length > 0) addFiles(newFiles);
        })
        .catch(() => {
          fileInputRef.current?.click(); // 对话框异常时回退 input
        });
    } else {
      fileInputRef.current?.click();
    }
  }, [addFiles, supportedExtensions]);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length > 0) addFiles(selected);
      e.target.value = ''; // 清空 input 以便重复选择同名文件
    },
    [addFiles],
  );

  /**
   * 下载
   * 桌面端：原生保存对话框让用户选位置
   * Web 端：fetch → blob → <a download>
   */
  const downloadByUrl = useCallback(async (url: string, filename: string) => {
    if (isTauri()) {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      const res = await fetch(url);
      const blob = await res.blob();
      const buf = await blob.arrayBuffer();
      const data = new Uint8Array(buf);
      const filePath = await save({ defaultPath: filename });
      if (filePath) {
        await writeFile(filePath, data);
      }
    } else {
      window.open(url);
    }
  }, []);

  const handleDownloadSingle = useCallback(
    (index: number, filename: string) => {
      if (!taskId) return;
      downloadByUrl(getSingleDownloadUrl(taskId, index), filename);
    },
    [taskId, downloadByUrl],
  );

  const handleDownloadBatch = useCallback(() => {
    if (!taskId) return;
    downloadByUrl(getBatchDownloadUrl(taskId), 'pancake_audios.zip');
  }, [taskId, downloadByUrl]);

  /**
   * 转换
   */
  // 计算总原始大小
  const totalOriginalSize = files.reduce((sum, f) => sum + f.size, 0);

  // 计算总转换后大小（只统计成功条目）
  const totalConvertedSize = results
    .filter((r) => r.status === 'success')
    .reduce((sum, r) => sum + r.converted_size, 0);

  // 计算压缩率和节省的空间
  const compressionStats =
    totalOriginalSize > 0
      ? {
          ratio: ((1 - totalConvertedSize / totalOriginalSize) * 100).toFixed(1),
          saved: formatFileSize(Math.max(0, totalOriginalSize - totalConvertedSize)),
        }
      : null;

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return;
    setStatus('converting');
    setResults([]);
    log.info(`开始转换 ${files.length} 个文件  →  ${targetFormat}`);

    try {
      const response = await convertAudio(
        files.map((f) => f.file),
        targetFormat,
      );

      if (!response.ok) {
        log.error('音频转换请求失败', response.error);
        toast('服务异常，请确认后端已启动后重试', 'error');
        setStatus('idle');
        return;
      }

      setResults(response.data.results);
      setTaskId(response.data.task_id);
      setStatus('done');

      // 统计成功/失败数量，给用户整体结果反馈
      const successCount = response.data.results.filter((r) => r.status === 'success').length;
      const failCount = response.data.results.filter((r) => r.status === 'error').length;
      if (failCount === 0) {
        toast(`全部 ${successCount} 个文件转换完成`, 'success');
      } else if (successCount === 0) {
        toast('全部转换失败', 'error');
      } else {
        toast(`${successCount} 个完成，${failCount} 个失败`, 'warn');
      }
      log.info('转换完成', { success: successCount, fail: failCount });
    } catch (err) {
      log.error('音频转换请求失败', err);
      toast('服务异常，请确认后端已启动后重试', 'error');
      setStatus('idle');
    }
  }, [files, targetFormat]);

  return (
    <div className={styles.page}>
      {/* ---- 上方：文件选择区 + 参数面板 ---- */}
      <div className={styles.topRow}>
        {/* 文件选择区 */}
        <div
          ref={dropRef}
          className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={handleClickSelect}
        >
          {files.length === 0 ? (
            <EmptyState
              title="拖拽音频文件到此处，或点击选择"
              description={`支持 ${supportedExtensions.join(' / ')}，单文件 ≤200MB`}
            />
          ) : (
            <div className={styles.dropZoneContent}>
              <IconContainer size={20} src={<VscAdd size={20} />} />
              <span>点击或拖拽继续添加</span>
              <span className={styles.dropZoneCount}>已选: {files.length} 个</span>
            </div>
          )}
        </div>

        {/* 放在 dropZone 外部，避免 click() 事件冒泡导致死循环 */}
        <input
          ref={fileInputRef}
          type="file"
          accept={inputAccept}
          multiple
          className={styles.hiddenInput}
          onChange={handleFileInput}
        />

        {/* 参数面板 */}
        <div className={styles.panel}>
          <div className={styles.paramRow}>
            <Select
              value={targetFormat}
              onChange={setTargetFormat}
              options={formatOptions}
              placeholder="选择格式"
              label="目标格式"
            />
          </div>

          {/* 格式说明（设计文档 2.3 的容器关系） */}
          <div className={styles.paramRow}>
            <span className={styles.formatHint}>
              OGG 与 OPUS 同为 OGG 容器，AAC 统一输出 .m4a（MP4 容器）
            </span>
          </div>

          {/* 开始转换按钮 */}
          <Button
            variant="primary"
            disabled={files.length === 0 || status === 'converting'}
            loading={status === 'converting'}
            loadingText={`转换中 (${files.length} 个)...`}
            onClick={handleConvert}
            style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
          >
            开始转换 ({files.length} 个)
          </Button>
        </div>
      </div>

      {/* ---- 下方：文件列表 / 进度 / 结果 ---- */}
      <div className={styles.bottomSection}>
        {/* 转换进行中 */}
        {status === 'converting' && (
          <div className={styles.convertingBar}>
            <Skeleton variant="rect" width="100%" height={4} />
            <span className={styles.convertingText}>
              {files.length} 个文件一次性提交，后端分批处理，全部完成后一次性展示结果...
            </span>
          </div>
        )}

        {/* 文件队列（转换前） */}
        {status === 'idle' && files.length > 0 && (
          <ScrollArea maxHeight={280}>
            <div className={styles.fileList}>
              <div className={styles.fileListHeader}>
                <span>
                  文件列表 ({files.length} 个，共 {formatFileSize(totalOriginalSize)})
                </span>
                <Button
                  variant="subtle"
                  icon={<IconContainer size={14} src={<VscTrash size={14} />} />}
                  onClick={clearFiles}
                >
                  清空
                </Button>
              </div>
              {files.map((f) => (
                <div key={f.id} className={styles.fileRow}>
                  <IconContainer size={36} src={<VscFileMedia size={18} />} />
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{f.name}</span>
                    <span className={styles.fileMeta}>
                      {f.format} · {formatFileSize(f.size)}
                    </span>
                  </div>
                  <Button
                    variant="subtle"
                    icon={<IconContainer size={14} src={<VscTrash size={14} />} />}
                    onClick={() => removeFile(f.id)}
                    title="移除"
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* 转换结果 */}
        {status === 'done' && results.length > 0 && (
          <>
            <ScrollArea maxHeight={280}>
              <div className={styles.fileList}>
                <div className={styles.fileListHeader}>
                  <span>转换结果</span>
                  {taskId && results.length > 1 && (
                    <Button
                      variant="subtle"
                      icon={<IconContainer size={14} src={<VscCloudDownload size={14} />} />}
                      onClick={handleDownloadBatch}
                    >
                      下载全部 (ZIP)
                    </Button>
                  )}
                </div>
                {results.map((r) => (
                  <div
                    key={r.index}
                    className={`${styles.fileRow} ${r.status === 'error' ? styles.fileRowError : ''}`}
                  >
                    {r.status === 'success' ? (
                      <IconContainer
                        size={20}
                        src={<VscCheck size={20} />}
                        className={styles.resultIconSuccess}
                      />
                    ) : (
                      <IconContainer
                        size={20}
                        src={<VscWarning size={20} />}
                        className={styles.resultIconError}
                      />
                    )}
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>
                        {r.original_name}
                        <span className={styles.arrowSep}>→</span>
                        {r.converted_name}
                      </span>
                      {r.status === 'success' ? (
                        <>
                          <span className={styles.fileMeta}>
                            {formatFileSize(r.original_size)}
                            <span className={styles.arrowSep}>→</span>
                            {formatFileSize(r.converted_size)} ·{' '}
                            {formatDuration(r.duration_seconds)} · {r.sample_rate}Hz ·{' '}
                            {(r.size_ratio * 100).toFixed(1)}%
                          </span>
                          {/* 后端返回的用户可见提示（如有损转无损不恢复音质） */}
                          {r.warning && <span className={styles.fileMetaWarn}>{r.warning}</span>}
                        </>
                      ) : (
                        <span className={styles.fileMetaError}>{r.error}</span>
                      )}
                    </div>
                    {r.status === 'success' && taskId && (
                      <Button
                        variant="subtle"
                        icon={<IconContainer size={14} src={<VscCloudDownload size={14} />} />}
                        onClick={() => handleDownloadSingle(r.index, r.converted_name)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* 压缩统计 */}
            {compressionStats && (
              <div className={styles.stats}>
                压缩率: {compressionStats.ratio}% · 节省: {compressionStats.saved}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
