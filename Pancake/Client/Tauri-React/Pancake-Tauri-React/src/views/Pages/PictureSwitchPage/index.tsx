import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createLogger } from '@/utils/logger';
import { isTauri } from '@/utils/isTauri';
import { formatFileSize } from '@/utils/file'
import {
    Button,
    Select,
    Switch,
    Input,
    ScrollArea,
    EmptyState,
    Skeleton,
    toast,
} from '@/components/common';
import { convertPictures, getFormats, filterSupportedFiles, getSingleDownloadUrl, getBatchDownloadUrl } from '@/services/PictureSwitch';
import type { FormatsResponse, ConvertResultItem } from '@/services/PictureSwitch';
import styles from './index.module.css';
import { VscAdd, VscTrash, VscCloudDownload, VscWarning, VscCheck } from 'react-icons/vsc';


const log = createLogger('PictureSwitchPage.tsx', 'PictureSwitchPage');



interface FileItem {
    id: string;           // 内置 File 没有唯一标识
    file: File;           // 内置 File 没有 "file" 属性（因为它自己就是 File）
    name: string;         // 内置有
    size: number;         // 内置有
    format: string;       // 前端提取的扩展名，内置没有
    thumbnailUrl: string; // 前端生成的缩略图 blob URL，内置没有
}



// 这个字段是用来标记图片转换的状态的，可能的值有 'idle'（空闲）、'converting'（转换中）和 'done'（完成）。
type ConvertStatus = 'idle' | 'converting' | 'done';

export default function PictureSwitchPage() {

    // ---- 用于存储从后端获取的输入格式列表 ----
    // useState约定的[a,b]始终标识a为字段，b为修改a的函数
    const [formatsData, setFormatsData] = useState<FormatsResponse | null>(null);

    // ---- 文件列表 ----
    const [files, setFiles] = useState<FileItem[]>([]);
    const filesRef = useRef<FileItem[]>([]);
    const fileIdCounter = useRef(0);

    // ---- 转换参数 ----
    const [targetFormat, setTargetFormat] = useState('webp');
    const [quality, setQuality] = useState(85);
    const [lossless, setLossless] = useState(false);
    const [resizeMode, setResizeMode] = useState<string>('none');
    const [maxWidth, setMaxWidth] = useState(1920);
    const [maxHeight, setMaxHeight] = useState(1080);
    const [exactWidth, setExactWidth] = useState(1920);
    const [exactHeight, setExactHeight] = useState(1080);
    const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
    const [stripMetadata, setStripMetadata] = useState(true);

    // ---- 转换状态 ----
    const [status, setStatus] = useState<ConvertStatus>('idle');
    const [results, setResults] = useState<ConvertResultItem[]>([]);
    const [taskId, setTaskId] = useState<string | null>(null);

    // ---- 拖拽 ----
    const dropRef = useRef<HTMLDivElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // ---- 点击选择（Tauri 原生对话框 + Web <input> 回退） ----
    const fileInputRef = useRef<HTMLInputElement>(null);



    // ---- 从后端获取的支持的输入格式列表（前端过滤和 UI 展示的唯一数据源） ----
    const supportedExtensions = formatsData?.input_formats ?? [];

    // ---- 当前目标格式的详情 ----
    const targetDetail = formatsData?.format_details[targetFormat];

    // ---- 显示质量参数的条件 ----
    const showQuality = targetDetail?.lossy_options === true;
    const showLosslessSwitch = targetFormat === 'webp'; // AVIF lossless 待确认，保守仅 WebP

    // ---- 缩放模式选项 ----
    const resizeModeOptions = [
        { value: 'none', label: '不缩放' },
        { value: 'fit', label: '等比适配' },
        { value: 'fill', label: '等比填充' },
        { value: 'exact', label: '精确尺寸' },
    ];

    const showFitFields = resizeMode === 'fit' || resizeMode === 'fill';
    const showExactFields = resizeMode === 'exact';


    useEffect(() => {
        getFormats().then((result) => {
            if (result.ok) {
                setFormatsData(result.data);
                log.info('获取输入格式数据:', result.data.input_formats);
                log.info('获取目标格式数据:', result.data.output_formats);
                log.info('获取格式详情数据:', result.data.format_details);
            } else {
                log.error('获取格式列表失败', result.error);
                toast('无法获取支持的格式列表', 'error');
            }
        });
    }, [])

    // ---- 格式选择器的选项 ----
    const formatOptions = useMemo(() => {
        if (!formatsData) return [];
        return formatsData.output_formats.map((f) => ({ value: f, label: f.toUpperCase() }));
    }, [formatsData]);

    /**
     * 文件选择
     */
    // useCallback是一个React Hook，它返回一个记忆化的回调函数。
    // 它的主要作用是优化性能，避免在每次渲染时都创建新的函数实例，从而减少不必要的重新渲染。
    // 两个参数，第一个参数是要缓存的函数，第二个参数是依赖的数组。
    // 数组里任意一个值改变时，useCallback都会返回一个新的函数实例。
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
                const id = `f-${++fileIdCounter.current}`;
                const ext = f.name.split('.').pop()?.toLowerCase() || '';
                return {
                    id,
                    file: f,
                    name: f.name,
                    size: f.size,
                    format: ext,
                    thumbnailUrl: URL.createObjectURL(f),
                };
            });
            setFiles((prev) => [...prev, ...items]);
            setStatus('idle');
            setResults([]);
            setTaskId(null);
            log.info(`添加 ${items.length} 个文件，当前共 ${files.length + items.length} 个`);
        },
        [files.length, supportedExtensions]

    );

    const removeFile = useCallback((id: string) => {
        setFiles((prev) => {
            const item = prev.find((f) => f.id === id);

            // URL.revokeObjectURL() 是浏览器内置的静态方法
            // 和 URL.createObjectURL() 配对使用
            // createObjectURL(blob) 在内存里创建一个虚拟 URL
            //（类似 blob:http://localhost/a3f2...），
            // 浏览器会一直持有这块内存直到你手动释放。
            // 不调用会内存泄漏——文件列表里每个图片的缩略图都占着一块 blob 内存，用户用得越久漏得越多。
            if (item) URL.revokeObjectURL(item.thumbnailUrl);
            return prev.filter((f) => f.id !== id);
        });
    }, []);

    const clearFiles = useCallback(() => {
        files.forEach((f) => URL.revokeObjectURL(f.thumbnailUrl));
        setFiles([]);
        setResults([]);
        setStatus('idle');
        setTaskId(null);
    }, [files]);


    // 拖拽
    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const dropped = Array.from(e.dataTransfer.files);
            if (dropped.length > 0) addFiles(dropped);
        },
        [addFiles],
    );

    // 点击选择
    const handleClickSelect = useCallback(() => {
        if (isTauri()) {
            import('@tauri-apps/plugin-dialog')
                .then(({ open }) =>
                    open({
                        multiple: true,
                        filters: [{ name: '图片', extensions: supportedExtensions }],
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
                            const bytes = await readFile(filePath);
                            const name = filePath.split(/[\\/]/).pop() || 'unknown';
                            newFiles.push(new File([bytes], name));
                        } catch (err) {
                            log.warn('读取文件失败', { path: filePath, error: String(err) });
                        }
                    }
                    if (newFiles.length > 0) addFiles(newFiles);
                })
                .catch(() => {
                    fileInputRef.current?.click();
                });

        }
        else {
            fileInputRef.current?.click();
        }
    }, [addFiles]);

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selected = Array.from(e.target.files || []);
            if (selected.length > 0) addFiles(selected);
            // 清空 input 以便重复选择同名文件
            e.target.value = '';
        },
        [addFiles],
    );

    // ---- 保持 filesRef 与 files 同步（供卸载清理使用） ----
    useEffect(() => {
        filesRef.current = files;
    }, [files]);

    // ---- 卸载时清理 blob URL ----
    useEffect(() => {
        return () => {
            filesRef.current.forEach((f) => URL.revokeObjectURL(f.thumbnailUrl));
        };
    }, []);


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
        downloadByUrl(getBatchDownloadUrl(taskId), 'pancake_pictures.zip');
    }, [taskId, downloadByUrl]);


    /**
     * 转换
     */
    // 计算总原始大小
    const totalOriginalSize = files.reduce((sum, f) => sum + f.size, 0);

    // 计算总转换后大小
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
        log.info(`开始转换 ${files.length} 个文件 → ${targetFormat}`);

        try {
            const params = {
                target_format: targetFormat,
                resize_mode: resizeMode as 'none' | 'fit' | 'fill' | 'exact',
                keep_aspect_ratio: resizeMode !== 'exact',
                ...(showQuality && !lossless && { quality }),
                ...(lossless && { lossless: true }),
                ...(showFitFields && { max_width: maxWidth, max_height: maxHeight }),
                ...(showExactFields && { width: exactWidth, height: exactHeight }),
                background_color: backgroundColor,
                color_mode: 'auto' as const,
                strip_metadata: stripMetadata,
            };

            const response = await convertPictures(
                files.map((f) => f.file),
                params,
            );

            if (!response.ok) {
                log.error('转换请求失败', response.error);
                toast('服务异常，请确认后端已启动后重试', 'error');
                setStatus('idle');
                return;
            }


            setResults(response.data.results);
            setTaskId(response.data.task_id);
            setStatus('done');

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
            log.error('转换请求失败', err);
            toast('服务异常，请确认后端已启动后重试', 'error');
            setStatus('idle');
        }
    }, [
        files,
        targetFormat,
        quality,
        lossless,
        resizeMode,
        maxWidth,
        maxHeight,
        backgroundColor,
        stripMetadata,
        showQuality,
        showFitFields,
        showExactFields,
    ]);




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
                            title="拖拽图片到此处，或点击选择"
                            description={`支持 ${supportedExtensions.map((e) => e.toUpperCase()).join(' / ')}，单文件 ≤100MB`}
                        />
                    ) : (
                        <div className={styles.dropZoneContent}>
                            <VscAdd size={20} />
                            <span>点击或拖拽继续添加</span>
                            <span className={styles.dropZoneCount}>已选: {files.length} 个</span>
                        </div>
                    )}
                </div>

                {/* 放在 dropZone 外部，避免 click() 事件冒泡导致死循环 */}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className={styles.hiddenInput}
                    onChange={handleFileInput}
                />
                {/* 参数面板 */}
                <div className={styles.panel}>
                    {/* 目标格式 */}
                    <div className={styles.paramRow}>
                        <label className={styles.paramLabel}>目标格式</label>
                        <Select
                            value={targetFormat}
                            onChange={setTargetFormat}
                            options={formatOptions}
                            placeholder="选择格式"
                        />
                    </div>

                    {/* 压缩方式（仅 WebP） */}
                    {showLosslessSwitch && (
                        <div className={styles.paramRow}>
                            <Switch
                                checked={lossless}
                                onChange={setLossless}
                                label={lossless ? '无损压缩' : '质量优先'}
                            />
                        </div>
                    )}

                    {/* 质量滑块 */}
                    {showQuality && !lossless && (
                        <div className={styles.paramRow}>
                            <label className={styles.paramLabel}>
                                质量: <span className={styles.qualityValue}>{quality}</span>
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={100}
                                value={quality}
                                onChange={(e) => setQuality(Number(e.target.value))}
                                className={styles.qualitySlider}
                            />
                        </div>
                    )}

                    {/* 缩放模式 */}
                    <div className={styles.paramRow}>
                        <label className={styles.paramLabel}>缩放模式</label>
                        <Select
                            value={resizeMode}
                            onChange={setResizeMode}
                            options={resizeModeOptions}
                            placeholder="不缩放"
                        />
                    </div>

                    {/* fit/fill 宽高 */}
                    {showFitFields && (
                        <div className={styles.paramRow}>
                            <label className={styles.paramLabel}>尺寸限制</label>
                            <div className={styles.sizeRow}>
                                <Input
                                    value={String(maxWidth)}
                                    onChange={(v) => setMaxWidth(Number(v) || 0)}
                                    type="number"
                                    placeholder="宽"
                                    style={{ width: 80 }}
                                />
                                <span className={styles.sizeSep}>×</span>
                                <Input
                                    value={String(maxHeight)}
                                    onChange={(v) => setMaxHeight(Number(v) || 0)}
                                    type="number"
                                    placeholder="高"
                                    style={{ width: 80 }}
                                />
                                <span className={styles.sizeUnit}>px</span>
                            </div>
                        </div>
                    )}

                    {/* exact 宽高 */}
                    {showExactFields && (
                        <div className={styles.paramRow}>
                            <label className={styles.paramLabel}>精确尺寸</label>
                            <div className={styles.sizeRow}>
                                <Input
                                    value={String(exactWidth)}
                                    onChange={(v) => setExactWidth(Number(v) || 0)}
                                    type="number"
                                    placeholder="宽"
                                    style={{ width: 80 }}
                                />
                                <span className={styles.sizeSep}>×</span>
                                <Input
                                    value={String(exactHeight)}
                                    onChange={(v) => setExactHeight(Number(v) || 0)}
                                    type="number"
                                    placeholder="高"
                                    style={{ width: 80 }}
                                />
                                <span className={styles.sizeUnit}>px</span>
                            </div>
                        </div>
                    )}

                    {/* 填充色 */}
                    <div className={styles.paramRow}>
                        <label className={styles.paramLabel}>透明填充</label>
                        <div className={styles.colorRow}>
                            <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className={styles.colorInput}
                            />
                            <span className={styles.colorValue}>{backgroundColor}</span>
                        </div>
                    </div>

                    {/* 移除元数据 */}
                    <div className={styles.paramRow}>
                        <Switch
                            checked={stripMetadata}
                            onChange={setStripMetadata}
                            label="移除元数据（EXIF等）"
                        />
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
                            {files.length} 个文件一次性提交，后端顺序处理，全部完成后一次性展示结果...
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
                                <button className={styles.clearBtn} onClick={clearFiles}>
                                    <VscTrash size={14} />
                                    清空
                                </button>
                            </div>
                            {files.map((f) => (
                                <div key={f.id} className={styles.fileRow}>
                                    <img className={styles.fileThumb} src={f.thumbnailUrl} alt={f.name} />
                                    <div className={styles.fileInfo}>
                                        <span className={styles.fileName}>{f.name}</span>
                                        <span className={styles.fileMeta}>
                                            {f.format.toUpperCase()} · {formatFileSize(f.size)}
                                        </span>
                                    </div>
                                    <button
                                        className={styles.fileRemove}
                                        onClick={() => removeFile(f.id)}
                                        title="移除"
                                    >
                                        <VscTrash size={14} />
                                    </button>
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
                                        <Button variant="subtle" onClick={handleDownloadBatch}>
                                            <VscCloudDownload size={14} />
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
                                            <VscCheck size={20} className={styles.resultIconSuccess} />
                                        ) : (
                                            <VscWarning size={20} className={styles.resultIconError} />
                                        )}
                                        <div className={styles.fileInfo}>
                                            <span className={styles.fileName}>
                                                {r.original_name} → {r.converted_name}
                                            </span>
                                            {r.status === 'success' ? (
                                                <span className={styles.fileMeta}>
                                                    {formatFileSize(r.original_size)} → {formatFileSize(r.converted_size)} ·{' '}
                                                    {r.original_resolution} → {r.converted_resolution} ·{' '}
                                                    {(r.size_ratio * 100).toFixed(1)}%
                                                </span>
                                            ) : (
                                                <span className={styles.fileMetaError}>{r.error}</span>
                                            )}
                                        </div>
                                        {r.status === 'success' && taskId && (
                                            <Button variant="subtle" onClick={() => handleDownloadSingle(r.index, r.converted_name)}>
                                                <VscCloudDownload size={14} />
                                            </Button>
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







    )





}