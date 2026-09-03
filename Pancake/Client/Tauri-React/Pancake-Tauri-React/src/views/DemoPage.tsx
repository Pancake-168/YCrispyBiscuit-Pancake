import { useState } from 'react';
import { createLogger } from '@/utils/logger';
import styles from './DemoPage.module.css';
import {
  Accordion,
  AlertDialog,
  AspectRatio,
  Breadcrumb,
  Button,
  Calendar,
  Cascader,
  Checkbox,
  Collapsible,
  Combobox,
  CommandPalette,
  Confirm,
  ContextMenu,
  DatePicker,
  Dialog,
  Drawer,
  DropdownMenu,
  EmptyState,
  HoverCard,
  IconContainer,
  Input,
  Label,
  Menubar,
  NavigationMenu,
  Popover,
  Progress,
  RadioGroup,
  Rating,
  ScrollArea,
  SegmentedControl,
  Select,
  Separator,
  Skeleton,
  Slider,
  Stepper,
  Switch,
  Tabs,
  Textarea,
  Toggle,
  Toolbar,
  Tooltip,
  TreeSelect,
  VisuallyHidden,
  toast,
} from '@/components/common';
import type { MenuItem } from '@/components/common';
import { getIcon } from '@/icons';

const log = createLogger('Demo.tsx', 'DemoPage');

// ============================================================
// 页面布局辅助
// ============================================================

/** Demo 区块标题栏 */
function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {description && <p className={styles.sectionDesc}>{description}</p>}
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

/** 行内示例容器 */
function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      {label && <span className={styles.label}>{label}</span>}
      {children}
    </div>
  );
}

// ============================================================
// Demo 页面
// ============================================================

/**
 * 此页面用于展示所有 common 组件的常规用法，作为便携参考代码。
 */
export default function DemoPage() {
  log.info('进入Demo页');

  // ---- 各组件演示所需状态 ----

  // Input
  const [inputValue, setInputValue] = useState('');
  const [inputErrorValue, setInputErrorValue] = useState('错误内容');

  // Textarea
  const [textareaValue, setTextareaValue] = useState('');

  // Select
  const [selectValue, setSelectValue] = useState('');

  // Switch
  const [switchOn, setSwitchOn] = useState(false);

  // Dialog（外部受控）
  const [dialogOpen, setDialogOpen] = useState(false);

  // Confirm
  const [confirmDefaultOpen, setConfirmDefaultOpen] = useState(false);
  const [confirmDangerOpen, setConfirmDangerOpen] = useState(false);
  const [confirmExtraOpen, setConfirmExtraOpen] = useState(false);

  // Tabs
  const [activeTabLog, setActiveTabLog] = useState('tab-1');

  // Checkbox
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  // RadioGroup
  const [radioValue, setRadioValue] = useState('option-1');

  // Slider
  const [sliderValue, setSliderValue] = useState([40]);

  // Toggle
  const [togglePressed, setTogglePressed] = useState(false);

  // SegmentedControl
  const [segmentValue, setSegmentValue] = useState('list');

  // Rating
  const [ratingValue, setRatingValue] = useState(3);

  // Combobox
  const [comboboxValue, setComboboxValue] = useState('apple');

  // CommandPalette
  const [commandOpen, setCommandOpen] = useState(false);

  // Stepper
  const [stepperCurrent, setStepperCurrent] = useState(0);

  // DatePicker / Calendar
  const [dateValue, setDateValue] = useState<Date | undefined>(undefined);

  // TreeSelect
  const [treeValue, setTreeValue] = useState('frontend-react');

  // Cascader
  const [cascaderValue, setCascaderValue] = useState<string[]>([]);

  // ---- Select 选项 ----
  const fruitOptions = [
    { value: 'apple', label: '苹果' },
    { value: 'banana', label: '香蕉' },
    { value: 'cherry', label: '樱桃' },
    { value: 'durian', label: '榴莲（不可选）', disabled: true },
    { value: 'grape', label: '葡萄' },
  ];

  // ---- DropdownMenu 菜单项 ----
  const dropdownItems: MenuItem[] = [
    {
      label: '编辑',
      icon: <IconContainer size={14} src={getIcon('edit', 14)} />,
      shortcut: '⌘E',
      onClick: () => toast('点击了编辑', 'info'),
    },
    {
      label: '复制',
      icon: <IconContainer size={14} src={getIcon('copy', 14)} />,
      shortcut: '⌘C',
      onClick: () => toast('已复制', 'success'),
    },
    {
      label: '刷新',
      icon: <IconContainer size={14} src={getIcon('refresh', 14)} />,
      onClick: () => toast('已刷新', 'success'),
    },
    { label: '', separator: true as const },
    {
      label: '删除',
      icon: <IconContainer size={14} src={getIcon('trash', 14)} />,
      danger: true,
      onClick: () => toast('删除操作需确认', 'warn'),
    },
  ];

  // ---- ContextMenu 菜单项 ----
  const contextMenuItems: MenuItem[] = [
    {
      label: '查看详情',
      icon: <IconContainer size={14} src={getIcon('info', 14)} />,
      onClick: () => toast('查看详情', 'info'),
    },
    {
      label: '复制文本',
      icon: <IconContainer size={14} src={getIcon('copy', 14)} />,
      shortcut: '⌘C',
      onClick: () => toast('已复制', 'success'),
    },
    { label: '', separator: true as const },
    {
      label: '删除',
      icon: <IconContainer size={14} src={getIcon('trash', 14)} />,
      danger: true,
      onClick: () => toast('已删除', 'error'),
    },
  ];

  // ---- Tabs ----
  const demoTabs = [
    {
      id: 'tab-1',
      label: '概览',
      icon: <IconContainer size={14} src={getIcon('home', 14)} />,
      content: <p className={styles.textBase}>这是概览标签页的内容。</p>,
    },
    {
      id: 'tab-2',
      label: '设置',
      icon: <IconContainer size={14} src={getIcon('settingsGear', 14)} />,
      content: <p className={styles.textBase}>这是设置标签页的内容。</p>,
    },
    {
      id: 'tab-3',
      label: '通知',
      icon: <IconContainer size={14} src={getIcon('bell', 14)} />,
      content: <p className={styles.textBase}>这是通知标签页的内容。</p>,
    },
  ];

  // ---- ScrollArea 示例长文本 ----
  const scrollContent = Array.from({ length: 20 }, (_, i) => (
    <p key={i} className={styles.scrollLine}>
      第 {i + 1} 行：这是一段用于演示滚动区域的示例文本内容。
    </p>
  ));

  // ============================================================
  // 渲染
  // ============================================================

  return (
    <div className={styles.demoPage}>
      {/* 页面标题 */}
      <div className={styles.header}>
        <h1 className={styles.title}>Common 组件示例</h1>
        <p className={styles.subtitle}>共 46 个基础组件，一一展示常规用法</p>
      </div>

      {/* ================================================ */}
      {/* §1 Button                                          */}
      {/* ================================================ */}
      <Section
        id="button"
        title="§1 Button"
        description="封装 loading 态的原子按钮，样式来自全局 .btn.* 类。"
      >
        <Row label="变体">
          <Button variant="primary">主按钮</Button>
          <Button variant="secondary">次要按钮</Button>
          <Button variant="subtle">低调按钮</Button>
          <Button variant="danger">危险按钮</Button>
        </Row>
        <Row label="带图标">
          <Button variant="primary" icon={<IconContainer size={14} src={getIcon('add', 14)} />}>
            新建
          </Button>
          <Button
            variant="secondary"
            icon={<IconContainer size={14} src={getIcon('search', 14)} />}
          >
            搜索
          </Button>
          <Button variant="subtle" icon={<IconContainer size={14} src={getIcon('edit', 14)} />}>
            编辑
          </Button>
          <Button variant="danger" icon={<IconContainer size={14} src={getIcon('trash', 14)} />}>
            删除
          </Button>
        </Row>
        <Row label="Loading">
          <Button variant="primary" loading>
            提交中
          </Button>
          <Button variant="primary" loading loadingText="保存中...">
            保存
          </Button>
        </Row>
        <Row label="禁用">
          <Button variant="primary" disabled>
            禁用主按钮
          </Button>
          <Button variant="secondary" disabled>
            禁用次要按钮
          </Button>
          <Button variant="subtle" disabled>
            禁用低调按钮
          </Button>
        </Row>
        <Row label="全宽">
          <Button variant="subtle" block>
            全宽列表项
          </Button>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §2 IconContainer                                   */}
      {/* ================================================ */}
      <Section
        id="iconContainer"
        title="§2 IconContainer"
        description="统一图片/图标容器，固定尺寸居中裁剪。"
      >
        <Row label="圆角方形">
          <IconContainer
            size={48}
            shape="rounded"
            src="https://github.com/fluidicon.png"
            alt="GitHub"
          />
          <IconContainer
            size={64}
            shape="rounded"
            src="https://github.com/fluidicon.png"
            alt="GitHub"
          />
          <IconContainer
            size={80}
            shape="rounded"
            src="https://github.com/fluidicon.png"
            alt="GitHub"
          />
        </Row>
        <Row label="圆形">
          <IconContainer
            size={48}
            shape="circle"
            src="https://github.com/fluidicon.png"
            alt="GitHub"
          />
          <IconContainer
            size={64}
            shape="circle"
            src="https://github.com/fluidicon.png"
            alt="GitHub"
          />
          <IconContainer
            size={80}
            shape="circle"
            src="https://github.com/fluidicon.png"
            alt="GitHub"
          />
        </Row>
        <Row label="ReactNode 图标">
          <IconContainer size={40} shape="rounded" src={getIcon('github', 22)} />
          <IconContainer size={40} shape="circle" src={getIcon('home', 20)} />
          <IconContainer size={40} shape="rounded" src={getIcon('person', 22)} />
        </Row>
        <Row label="加载失败 fallback">
          <IconContainer size={48} shape="rounded" src="/nonexistent.png" alt="不存在的图片" />
          <IconContainer
            size={48}
            shape="circle"
            src="/nonexistent.png"
            alt="不存在的图片"
            fallback={getIcon('error', 22)}
          />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §3 Input                                           */}
      {/* ================================================ */}
      <Section
        id="input"
        title="§3 Input"
        description="单行文本输入，支持 label / helper / error 状态。"
      >
        <Row label="基础">
          <Input
            value={inputValue}
            onChange={setInputValue}
            placeholder="请输入内容..."
            className={styles.w260}
          />
        </Row>
        <Row label="带标签">
          <Input
            value={inputValue}
            onChange={setInputValue}
            label="用户名"
            placeholder="请输入用户名"
            className={styles.w260}
          />
        </Row>
        <Row label="辅助说明">
          <Input
            value={inputValue}
            onChange={setInputValue}
            label="邮箱"
            helper="请输入有效的邮箱地址"
            placeholder="example@mail.com"
            className={styles.w260}
          />
        </Row>
        <Row label="错误状态">
          <Input
            value={inputErrorValue}
            onChange={setInputErrorValue}
            label="密码"
            error="密码长度不能少于 8 位"
            type="password"
            className={styles.w260}
          />
        </Row>
        <Row label="禁用">
          <Input value="不可编辑" onChange={() => {}} disabled className={styles.w260} />
        </Row>
        <Row label="数字">
          <Input
            value="42"
            onChange={() => {}}
            label="数量"
            type="number"
            className={styles.w160}
          />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §4 Textarea                                        */}
      {/* ================================================ */}
      <Section
        id="textarea"
        title="§4 Textarea"
        description="多行文本输入，复用 Input 的 Token 体系。"
      >
        <Row label="基础">
          <Textarea
            value={textareaValue}
            onChange={setTextareaValue}
            placeholder="请输入多行文本..."
            className={styles.w320}
          />
        </Row>
        <Row label="带标签 + 计数">
          <Textarea
            value={textareaValue}
            onChange={setTextareaValue}
            label="简介"
            helper={`${textareaValue.length} / 200`}
            maxLength={200}
            rows={4}
            placeholder="请填写简介，最多 200 字"
            className={styles.w320}
          />
        </Row>
        <Row label="错误状态">
          <Textarea
            value=""
            onChange={() => {}}
            label="必填项"
            error="此字段为必填项"
            placeholder="请输入..."
            className={styles.w320}
          />
        </Row>
        <Row label="禁用">
          <Textarea
            value="这是一段只读的文本内容。"
            onChange={() => {}}
            disabled
            className={styles.w320}
          />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §5 Select                                          */}
      {/* ================================================ */}
      <Section
        id="select"
        title="§5 Select"
        description="下拉选择器，Radix Select 骨架 + .glass 面板 Token。"
      >
        <Row label="基础">
          <Select
            value={selectValue}
            onChange={setSelectValue}
            options={fruitOptions}
            placeholder="请选择水果..."
          />
        </Row>
        <Row label="带标签">
          <Select
            value={selectValue}
            onChange={setSelectValue}
            options={fruitOptions}
            label="水果"
            placeholder="请选择..."
          />
        </Row>
        <Row label="已选中">
          <Select value="apple" onChange={() => {}} options={fruitOptions} label="已选水果" />
        </Row>
        <Row label="禁用">
          <Select
            value=""
            onChange={() => {}}
            options={fruitOptions}
            placeholder="不可用"
            disabled
          />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §6 Switch                                          */}
      {/* ================================================ */}
      <Section id="switch" title="§6 Switch" description="布尔值开关，Radix Switch 骨架。">
        <Row label="基础">
          <Switch checked={switchOn} onChange={setSwitchOn} />
        </Row>
        <Row label="带标签">
          <Switch
            checked={switchOn}
            onChange={setSwitchOn}
            label={switchOn ? '已开启' : '已关闭'}
          />
        </Row>
        <Row label="开启态">
          <Switch checked={true} onChange={() => {}} label="通知开关" />
        </Row>
        <Row label="禁用">
          <Switch checked={false} onChange={() => {}} label="不可操作" disabled />
          <Switch checked={true} onChange={() => {}} disabled />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §7 Tooltip                                         */}
      {/* ================================================ */}
      <Section
        id="tooltip"
        title="§7 Tooltip"
        description="悬停提示，仅文字，深色固定不随主题变化。"
      >
        <Row label="上（默认）">
          <Tooltip content="这是上方弹出的提示文字">
            <Button variant="subtle">悬停看提示（上）</Button>
          </Tooltip>
        </Row>
        <Row label="四个方向">
          <Tooltip content="上方提示" side="top">
            <Button variant="subtle">上</Button>
          </Tooltip>
          <Tooltip content="右侧提示" side="right">
            <Button variant="subtle">右</Button>
          </Tooltip>
          <Tooltip content="下方提示" side="bottom">
            <Button variant="subtle">下</Button>
          </Tooltip>
          <Tooltip content="左侧提示" side="left">
            <Button variant="subtle">左</Button>
          </Tooltip>
        </Row>
        <Row label="长延迟">
          <Tooltip content="悬停 1 秒后才出现" delayDuration={1000}>
            <Button variant="subtle">悬停 1s</Button>
          </Tooltip>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §8 Popover                                         */}
      {/* ================================================ */}
      <Section
        id="popover"
        title="§8 Popover"
        description="轻量弹出卡片，点击触发，可嵌套任意组件。"
      >
        <Row label="表单卡片">
          <Popover
            trigger={<Button variant="secondary">打开筛选面板</Button>}
            side="bottom"
            align="start"
          >
            <div className={styles.popoverForm}>
              <Input
                value={inputValue}
                onChange={setInputValue}
                label="关键字"
                placeholder="输入关键字..."
              />
              <Select
                value={selectValue}
                onChange={setSelectValue}
                options={fruitOptions}
                label="分类"
                placeholder="选择分类"
              />
              <Switch checked={switchOn} onChange={setSwitchOn} label="仅显示启用项" />
              <Button variant="primary" onClick={() => toast('筛选条件已应用', 'success')}>
                应用
              </Button>
            </div>
          </Popover>
        </Row>
        <Row label="不同对齐">
          <Popover trigger={<Button variant="subtle">开头对齐</Button>} side="bottom" align="start">
            <div className={styles.popoverText}>这是一个开头对齐的卡片</div>
          </Popover>
          <Popover
            trigger={<Button variant="subtle">居中对齐</Button>}
            side="bottom"
            align="center"
          >
            <div className={styles.popoverText}>这是一个居中对齐的卡片</div>
          </Popover>
          <Popover trigger={<Button variant="subtle">末尾对齐</Button>} side="bottom" align="end">
            <div className={styles.popoverText}>这是一个末尾对齐的卡片</div>
          </Popover>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §9 DropdownMenu                                    */}
      {/* ================================================ */}
      <Section
        id="dropdownMenu"
        title="§9 DropdownMenu"
        description="下拉菜单，支持图标、快捷键、分隔线、危险项。"
      >
        <Row label="完整菜单">
          <DropdownMenu
            trigger={<Button variant="secondary">打开菜单</Button>}
            items={dropdownItems}
          />
        </Row>
        <Row label="纯文字菜单">
          <DropdownMenu
            trigger={<Button variant="subtle">简单菜单</Button>}
            items={[
              { label: '选项一', onClick: () => toast('选项一', 'info') },
              { label: '选项二', onClick: () => toast('选项二', 'info') },
              { label: '', separator: true as const },
              { label: '禁用项', disabled: true, onClick: () => {} },
            ]}
          />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §10 ContextMenu                                    */}
      {/* ================================================ */}
      <Section
        id="contextMenu"
        title="§10 ContextMenu"
        description="右键菜单，完全复用 DropdownMenu 的 MenuItem 结构和样式。"
      >
        <Row label="右键区域">
          <ContextMenu items={contextMenuItems}>
            <div className={`${styles.contextArea} ${styles.contextCursor}`}>
              在此区域右键点击查看菜单
            </div>
          </ContextMenu>
        </Row>
        <Row label="禁用右键">
          <ContextMenu items={contextMenuItems} disabled>
            <div className={styles.contextArea}>此区域右键菜单已禁用</div>
          </ContextMenu>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §11 Dialog                                         */}
      {/* ================================================ */}
      <Section
        id="dialog"
        title="§11 Dialog"
        description="通用弹窗，遮罩层模糊背景，内部可自由组合任意下层组件。"
      >
        <Row label="Trigger 触发">
          <Dialog
            trigger={<Button variant="primary">打开弹窗（Trigger）</Button>}
            title="用户信息"
            description="请填写以下信息"
          >
            <div className={styles.sectionBody}>
              <Input
                value={inputValue}
                onChange={setInputValue}
                label="姓名"
                placeholder="请输入姓名"
              />
              <Select
                value={selectValue}
                onChange={setSelectValue}
                options={fruitOptions}
                label="偏好水果"
                placeholder="请选择"
              />
            </div>
          </Dialog>
        </Row>
        <Row label="外部受控">
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            打开弹窗（受控）
          </Button>
          <Dialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            title="提示"
            description="这是一个外部状态控制的弹窗"
          >
            <p className={styles.textSm}>弹窗内容区域，可以放置任意组件。</p>
          </Dialog>
        </Row>
        <Row label="无 description">
          <Dialog trigger={<Button variant="subtle">简洁弹窗</Button>} title="简洁标题">
            <p className={styles.textSm}>没有 description 的简洁弹窗。</p>
          </Dialog>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §12 Confirm                                        */}
      {/* ================================================ */}
      <Section
        id="confirm"
        title="§12 Confirm"
        description="Dialog 的预设子集，预置按钮槽位 [取消] [...额外按钮] [确认]。"
      >
        <Row label="默认确认">
          <Button variant="secondary" onClick={() => setConfirmDefaultOpen(true)}>
            删除文件确认
          </Button>
          <Confirm
            open={confirmDefaultOpen}
            onOpenChange={setConfirmDefaultOpen}
            title="确认删除"
            description="此操作将删除所选文件，删除后可在回收站恢复。"
            onConfirm={() => toast('文件已删除', 'success')}
          >
            <p className={styles.textSm}>确定要删除选中的 3 个文件吗？</p>
          </Confirm>
        </Row>
        <Row label="危险确认">
          <Button variant="danger" onClick={() => setConfirmDangerOpen(true)}>
            永久删除
          </Button>
          <Confirm
            open={confirmDangerOpen}
            onOpenChange={setConfirmDangerOpen}
            title="永久删除"
            description="此操作不可撤销，数据将永久丢失。"
            variant="danger"
            confirmLabel="永久删除"
            cancelLabel="我再想想"
            onConfirm={() => toast('数据已永久删除', 'error')}
          />
        </Row>
        <Row label="额外按钮">
          <Button variant="secondary" onClick={() => setConfirmExtraOpen(true)}>
            关闭文档
          </Button>
          <Confirm
            open={confirmExtraOpen}
            onOpenChange={setConfirmExtraOpen}
            title="保存确认"
            description="文档已修改，关闭前是否保存？"
            confirmLabel="保存"
            cancelLabel="取消"
            onConfirm={() => toast('文档已保存', 'success')}
            extraButtons={[
              { label: '不保存', variant: 'subtle', onClick: () => toast('已放弃修改', 'info') },
            ]}
          >
            <p className={styles.textSm}>如果选择不保存，所有未保存的修改将会丢失。</p>
          </Confirm>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §13 Toast                                          */}
      {/* ================================================ */}
      <Section
        id="toast"
        title="§13 Toast"
        description="全局消息通知，独立通知通道。点击按钮触发，Toast 从右上角滑入。"
      >
        <Row label="四种变体">
          <Button variant="primary" onClick={() => toast('操作成功！', 'success')}>
            Success
          </Button>
          <Button variant="danger" onClick={() => toast('操作失败！', 'error')}>
            Error
          </Button>
          <Button variant="secondary" onClick={() => toast('请注意此操作的影响', 'warn')}>
            Warn
          </Button>
          <Button variant="subtle" onClick={() => toast('这是一条普通信息', 'info')}>
            Info
          </Button>
        </Row>
        <Row label="带操作按钮">
          <Button
            variant="subtle"
            onClick={() =>
              toast({
                message: '文件已删除',
                variant: 'success',
                duration: 5000,
                action: { label: '撤销', onClick: () => toast('已撤销删除', 'info') },
              })
            }
          >
            可撤销 Toast
          </Button>
        </Row>
        <Row label="纯字符串调用">
          <Button variant="subtle" onClick={() => toast('你好，这是一条快捷消息', 'info')}>
            快捷 Toast
          </Button>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §14 Tabs                                           */}
      {/* ================================================ */}
      <Section id="tabs" title="§14 Tabs" description="标签页切换容器，Radix Tabs 骨架。">
        <Row label={`带图标（当前: ${activeTabLog}）`}>
          <div className={styles.w100}>
            <Tabs
              tabs={demoTabs}
              defaultTab="tab-1"
              onChange={(id) => {
                setActiveTabLog(id);
                log.info(`切换至标签: ${id}`);
              }}
            />
          </div>
        </Row>
        <Row label="纯文字">
          <div className={styles.w100}>
            <Tabs
              tabs={[
                {
                  id: 'a',
                  label: '标签A',
                  content: <span className={styles.textColor}>内容 A</span>,
                },
                {
                  id: 'b',
                  label: '标签B',
                  content: <span className={styles.textColor}>内容 B</span>,
                },
                {
                  id: 'c',
                  label: '标签C',
                  content: <span className={styles.textColor}>内容 C</span>,
                },
              ]}
              defaultTab="a"
            />
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §15 ScrollArea                                     */}
      {/* ================================================ */}
      <Section
        id="scrollArea"
        title="§15 ScrollArea"
        description="统一样式的滚动容器，替换原生滚动条。"
      >
        <Row label="固定高度滚动">
          <div className={styles.box400}>
            <ScrollArea maxHeight={160}>
              <div className={styles.scrollPadding}>{scrollContent}</div>
            </ScrollArea>
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §16 EmptyState                                     */}
      {/* ================================================ */}
      <Section id="emptyState" title="§16 EmptyState" description="空状态占位，列表无数据时显示。">
        <Row label="默认">
          <div className={styles.box400}>
            <EmptyState title="暂无数据" description="稍后再来看看吧" />
          </div>
        </Row>
        <Row label="带操作按钮">
          <div className={styles.box400}>
            <EmptyState
              title="还没有收藏"
              description="收藏的内容会显示在这里"
              action={
                <Button
                  variant="primary"
                  icon={<IconContainer size={14} src={getIcon('add', 14)} />}
                  onClick={() => toast('去发现内容', 'info')}
                >
                  去发现
                </Button>
              }
            />
          </div>
        </Row>
        <Row label="自定义图标">
          <div className={styles.box400}>
            <EmptyState
              icon={<IconContainer size={48} src={getIcon('search', 48)} />}
              title="无搜索结果"
              description="换个关键词试试"
            />
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §17 Skeleton                                       */}
      {/* ================================================ */}
      <Section id="skeleton" title="§17 Skeleton" description="骨架屏，内容加载中的占位动画。">
        <Row label="文本">
          <div className={styles.w300}>
            <Skeleton variant="text" />
          </div>
        </Row>
        <Row label="段落（5行）">
          <div className={styles.w320}>
            <Skeleton variant="text" count={5} />
          </div>
        </Row>
        <Row label="圆形">
          <Skeleton variant="circle" width={48} height={48} />
          <Skeleton variant="circle" width={32} height={32} />
          <Skeleton variant="circle" width={24} height={24} />
        </Row>
        <Row label="矩形">
          <Skeleton variant="rect" width={200} height={120} />
          <Skeleton variant="rect" width="100%" height={40} />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §18 Accordion                                      */}
      {/* ================================================ */}
      <Section
        id="accordion"
        title="§18 Accordion"
        description="手风琴折叠面板，支持单项与多项展开。"
      >
        <Row label="单项手风琴">
          <div className={styles.box420}>
            <Accordion
              items={[
                {
                  value: 'acc-1',
                  trigger: '基础说明',
                  content: <span>这里是 Accordion 第一项内容。</span>,
                },
                {
                  value: 'acc-2',
                  trigger: '使用场景',
                  content: <span>适合设置分组、FAQ、折叠详情等场景。</span>,
                },
                {
                  value: 'acc-3',
                  trigger: '禁用项',
                  disabled: true,
                  content: <span>这一项当前不可展开。</span>,
                },
              ]}
            />
          </div>
        </Row>
        <Row label="多项手风琴">
          <div className={styles.box420}>
            <Accordion
              type="multiple"
              items={[
                { value: 'multi-1', trigger: '第一项', content: <span>可以同时展开多项。</span> },
                {
                  value: 'multi-2',
                  trigger: '第二项',
                  content: <span>这一项也保持独立开关。</span>,
                },
              ]}
            />
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §19 AlertDialog                                    */}
      {/* ================================================ */}
      <Section
        id="alertDialog"
        title="§19 AlertDialog"
        description="AlertDialog — 需要明确确认的关键操作弹窗。"
      >
        <Row label="危险确认">
          <AlertDialog
            trigger={<Button variant="danger">永久删除</Button>}
            title="永久删除文件？"
            description="此操作不可撤销。"
            cancelLabel="再想想"
            actionLabel="永久删除"
            onAction={() => toast('文件已永久删除', 'error')}
          >
            <span>删除后无法恢复，请确认是否继续。</span>
          </AlertDialog>
        </Row>
        <Row label="普通确认">
          <AlertDialog
            trigger={<Button variant="secondary">退出登录</Button>}
            title="退出登录"
            description="退出后需要重新验证身份。"
            onAction={() => toast('已退出登录', 'success')}
          />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §20 AspectRatio                                    */}
      {/* ================================================ */}
      <Section
        id="aspectRatio"
        title="§20 AspectRatio"
        description="固定宽高比容器，适合图片、视频等媒体内容。"
      >
        <Row label="16:9">
          <div className={styles.w260}>
            <AspectRatio ratio={16 / 9}>
              <div className={styles.aspectFill}>16:9</div>
            </AspectRatio>
          </div>
        </Row>
        <Row label="1:1">
          <div className={styles.w120}>
            <AspectRatio ratio={1}>
              <div className={styles.aspectFill}>1:1</div>
            </AspectRatio>
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §21 Checkbox                                       */}
      {/* ================================================ */}
      <Section id="checkbox" title="§21 Checkbox" description="复选框，支持受控勾选与禁用态。">
        <Row label="受控">
          <Checkbox
            checked={checkboxChecked}
            onChange={setCheckboxChecked}
            label={checkboxChecked ? '已勾选' : '未勾选'}
          />
        </Row>
        <Row label="禁用">
          <Checkbox checked={false} onChange={() => {}} label="不可操作" disabled />
          <Checkbox checked={true} onChange={() => {}} disabled />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §22 Collapsible                                    */}
      {/* ================================================ */}
      <Section id="collapsible" title="§22 Collapsible" description="可展开/收起的折叠内容区。">
        <Row label="展开详情">
          <div className={styles.box420}>
            <Collapsible trigger="查看高级设置">
              <div className={styles.sectionBody}>
                <Checkbox
                  checked={checkboxChecked}
                  onChange={setCheckboxChecked}
                  label="启用实验功能"
                />
                <Button variant="subtle" onClick={() => toast('设置已保存', 'success')}>
                  保存设置
                </Button>
              </div>
            </Collapsible>
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §23 HoverCard                                      */}
      {/* ================================================ */}
      <Section id="hoverCard" title="§23 HoverCard" description="鼠标悬停后弹出的信息卡片。">
        <Row label="悬停查看">
          <HoverCard trigger={<Button variant="subtle">悬停查看用户</Button>}>
            <div className={styles.hoverCardContent}>
              <IconContainer
                size={40}
                shape="circle"
                src="https://github.com/fluidicon.png"
                alt="GitHub"
              />
              <div className={styles.columnFlex}>
                <span className={styles.hoverName}>Pancake</span>
                <span className={styles.textMutedXs}>悬停卡片示例</span>
              </div>
            </div>
          </HoverCard>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §24 Label                                         */}
      {/* ================================================ */}
      <Section id="label" title="§24 Label" description="表单标签，点击可聚焦关联控件。">
        <Row label="Label + Input">
          <div className={styles.labelColumn}>
            <Label htmlFor="demo-label-input">昵称</Label>
            <Input
              id="demo-label-input"
              value={inputValue}
              onChange={setInputValue}
              placeholder="请输入昵称"
              className={styles.w220}
            />
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §25 Menubar                                        */}
      {/* ================================================ */}
      <Section id="menubar" title="§25 Menubar" description="桌面风格顶部菜单栏。">
        <Row label="菜单栏">
          <Menubar
            menus={[
              {
                label: '文件',
                items: [
                  { label: '新建', onClick: () => toast('新建文件', 'info') },
                  { label: '打开', onClick: () => toast('打开文件', 'info') },
                  { label: '', separator: true as const },
                  { label: '退出', danger: true, onClick: () => toast('退出菜单', 'warn') },
                ],
              },
              {
                label: '编辑',
                items: [
                  { label: '复制', onClick: () => toast('复制', 'success') },
                  { label: '剪切', onClick: () => toast('剪切', 'success') },
                ],
              },
              {
                label: '帮助',
                content: <div className={styles.menuHelp}>帮助面板内容</div>,
              },
            ]}
          />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §26 NavigationMenu                                */}
      {/* ================================================ */}
      <Section
        id="navigationMenu"
        title="§26 NavigationMenu"
        description="导航菜单，支持普通链接与展开面板。"
      >
        <Row label="导航示例">
          <NavigationMenu
            items={[
              { label: '首页', onClick: () => toast('进入首页', 'info') },
              {
                label: '工具',
                content: (
                  <div className={styles.navContent}>
                    <Button variant="subtle" onClick={() => toast('音频转码', 'info')}>
                      音频转码
                    </Button>
                    <Button variant="subtle" onClick={() => toast('图片转码', 'info')}>
                      图片转码
                    </Button>
                  </div>
                ),
              },
              { label: '关于', onClick: () => toast('关于 Pancake', 'info') },
            ]}
          />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §27 Progress                                       */}
      {/* ================================================ */}
      <Section id="progress" title="§27 Progress" description="进度条，展示任务完成度。">
        <Row label="普通进度">
          <div className={styles.box320}>
            <Progress value={65} />
          </div>
        </Row>
        <Row label="接近完成">
          <div className={styles.box320}>
            <Progress value={92} />
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §28 RadioGroup                                     */}
      {/* ================================================ */}
      <Section id="radioGroup" title="§28 RadioGroup" description="单选组，键盘方向键可切换选项。">
        <Row label="单选">
          <RadioGroup
            value={radioValue}
            onChange={setRadioValue}
            label="偏好主题"
            options={[
              { value: 'option-1', label: '跟随系统' },
              { value: 'option-2', label: '深色' },
              { value: 'option-3', label: '浅色' },
            ]}
          />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §29 Separator                                      */}
      {/* ================================================ */}
      <Section id="separator" title="§29 Separator" description="横向或纵向视觉分隔线。">
        <Row label="横向">
          <div className={styles.w200}>
            <Separator />
          </div>
        </Row>
        <Row label="纵向">
          <div className={styles.separatorVerticalWrap}>
            <Separator orientation="vertical" />
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §30 Slider                                         */}
      {/* ================================================ */}
      <Section id="slider" title="§30 Slider" description="滑块，适合音量、亮度、数值范围等场景。">
        <Row label="受控滑块">
          <div className={styles.box320}>
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              label="数值"
              min={0}
              max={100}
            />
            <span className={styles.textMutedXs}>当前值：{sliderValue.join(', ')}</span>
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §31 Toggle                                         */}
      {/* ================================================ */}
      <Section id="toggle" title="§31 Toggle" description="按压态按钮，适合图标开关。">
        <Row label="按压开关">
          <Toggle pressed={togglePressed} onPressedChange={setTogglePressed} aria-label="切换通知">
            <IconContainer size={16} src={getIcon('bell', 16)} />
          </Toggle>
          <span className={styles.textMutedSm}>{togglePressed ? '已开启' : '已关闭'}</span>
        </Row>
        <Row label="禁用">
          <Toggle disabled aria-label="禁用切换">
            <IconContainer size={16} src={getIcon('bell', 16)} />
          </Toggle>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §32 VisuallyHidden                                 */}
      {/* ================================================ */}
      <Section
        id="visuallyHidden"
        title="§32 VisuallyHidden"
        description="视觉隐藏但保留给读屏器访问的内容。"
      >
        <Row label="读屏专用文本">
          <span className={styles.textMutedSm}>下面内容只对读屏器可见：</span>
          <VisuallyHidden>这是一段屏幕阅读器可访问但页面不可见的文本。</VisuallyHidden>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §33 Drawer                                        */}
      {/* ================================================ */}
      <Section
        id="drawer"
        title="§33 Drawer"
        description="从屏幕边缘滑出的抽屉面板，基于 Radix Dialog。"
      >
        <Row label="右侧抽屉">
          <Drawer
            trigger={<Button variant="secondary">打开设置抽屉</Button>}
            title="设置"
            side="right"
          >
            <p className={styles.drawerText}>这里可以放设置表单、详情内容等。</p>
          </Drawer>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §34 SegmentedControl                              */}
      {/* ================================================ */}
      <Section
        id="segmentedControl"
        title="§34 SegmentedControl"
        description="分段选择器，基于 Radix RadioGroup。"
      >
        <Row label="视图切换">
          <SegmentedControl
            value={segmentValue}
            onChange={setSegmentValue}
            options={[
              { value: 'list', label: '列表' },
              { value: 'grid', label: '网格' },
              { value: 'detail', label: '详情' },
            ]}
          />
        </Row>
        <Row label="当前值">
          <span className={styles.textMutedSm}>{segmentValue}</span>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §35 Rating                                        */}
      {/* ================================================ */}
      <Section id="rating" title="§35 Rating" description="星级评分，支持键盘方向键。">
        <Row label="评分">
          <Rating value={ratingValue} onChange={setRatingValue} />
        </Row>
        <Row label="当前分数">
          <span className={styles.textMutedSm}>{ratingValue} / 5</span>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §36 Breadcrumb                                    */}
      {/* ================================================ */}
      <Section id="breadcrumb" title="§36 Breadcrumb" description="面包屑导航，最后一项为当前页。">
        <Row label="导航路径">
          <Breadcrumb
            items={[
              { label: '首页', onClick: () => toast('返回首页', 'info') },
              { label: '工具', onClick: () => toast('进入工具', 'info') },
              { label: '图片转换' },
            ]}
          />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §37 Combobox                                      */}
      {/* ================================================ */}
      <Section
        id="combobox"
        title="§37 Combobox"
        description="可输入过滤的下拉选择，基于 Radix Popover。"
      >
        <Row label="水果选择">
          <div className={styles.w240}>
            <Combobox
              value={comboboxValue}
              onChange={setComboboxValue}
              options={fruitOptions.filter((item) => !item.disabled)}
              placeholder="输入或选择水果"
            />
          </div>
        </Row>
        <Row label="当前值">
          <span className={styles.textMutedSm}>{comboboxValue}</span>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §38 CommandPalette                                */}
      {/* ================================================ */}
      <Section
        id="commandPalette"
        title="§38 CommandPalette"
        description="命令面板，支持过滤与键盘操作。"
      >
        <Row label="打开命令面板">
          <Button variant="secondary" onClick={() => setCommandOpen(true)}>
            打开命令面板
          </Button>
          <CommandPalette
            open={commandOpen}
            onOpenChange={setCommandOpen}
            items={[
              {
                id: 'home',
                label: '回到首页',
                keywords: 'home',
                onSelect: () => toast('回到首页', 'info'),
              },
              {
                id: 'audio',
                label: '音频转码',
                keywords: 'audio',
                onSelect: () => toast('打开音频转码', 'info'),
              },
              {
                id: 'picture',
                label: '图片转码',
                keywords: 'picture',
                onSelect: () => toast('打开图片转码', 'info'),
              },
            ]}
          />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §39 Stepper                                       */}
      {/* ================================================ */}
      <Section id="stepper" title="§39 Stepper" description="步骤条，支持已到达步骤点击回退。">
        <Row label="步骤进度">
          <div className={styles.box520}>
            <Stepper
              current={stepperCurrent}
              onChange={setStepperCurrent}
              steps={[
                { title: '填写信息', description: '基本资料' },
                { title: '确认内容', description: '二次确认' },
                { title: '完成', description: '提交成功' },
              ]}
            />
          </div>
        </Row>
        <Row label="操作">
          <Button
            variant="secondary"
            disabled={stepperCurrent <= 0}
            onClick={() => setStepperCurrent((prev) => Math.max(0, prev - 1))}
          >
            上一步
          </Button>
          <Button
            variant="primary"
            disabled={stepperCurrent >= 2}
            onClick={() => setStepperCurrent((prev) => Math.min(2, prev + 1))}
          >
            下一步
          </Button>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §40 Toolbar                                       */}
      {/* ================================================ */}
      <Section
        id="toolbar"
        title="§40 Toolbar"
        description="工具条容器，内部放已封装的按钮/开关/分隔线。"
      >
        <Row label="工具栏">
          <Toolbar>
            <Button variant="subtle" onClick={() => toast('新建', 'info')}>
              新建
            </Button>
            <Separator orientation="vertical" />
            <Toggle pressed={togglePressed} onPressedChange={setTogglePressed} aria-label="粗体">
              <IconContainer size={14} src={getIcon('bell', 14)} />
            </Toggle>
            <Toggle pressed={false} onPressedChange={() => {}} aria-label="斜体">
              <IconContainer size={14} src={getIcon('search', 14)} />
            </Toggle>
            <Separator orientation="vertical" />
            <Button variant="subtle" onClick={() => toast('已保存', 'success')}>
              保存
            </Button>
          </Toolbar>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §41 Calendar                                      */}
      {/* ================================================ */}
      <Section
        id="calendar"
        title="§41 Calendar"
        description="日历面板，可直接嵌入页面或配合 DatePicker。"
      >
        <Row label="选择日期">
          <Calendar value={dateValue} onChange={setDateValue} />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §42 DatePicker                                    */}
      {/* ================================================ */}
      <Section
        id="datePicker"
        title="§42 DatePicker"
        description="日期选择，基于 Radix Popover + Calendar。"
      >
        <Row label="日期选择">
          <DatePicker value={dateValue} onChange={setDateValue} placeholder="请选择日期" />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §43 TreeSelect                                    */}
      {/* ================================================ */}
      <Section
        id="treeSelect"
        title="§43 TreeSelect"
        description="树形选择，支持展开/折叠与叶子选择。"
      >
        <Row label="选择节点">
          <div className={styles.w260}>
            <TreeSelect
              value={treeValue}
              onChange={setTreeValue}
              options={[
                {
                  value: 'frontend',
                  label: '前端',
                  children: [
                    {
                      value: 'frontend-react',
                      label: 'React',
                      children: [
                        { value: 'frontend-react-hooks', label: 'Hooks' },
                        { value: 'frontend-react-router', label: 'Router' },
                      ],
                    },
                    { value: 'frontend-vue', label: 'Vue' },
                  ],
                },
                {
                  value: 'backend',
                  label: '后端',
                  children: [
                    { value: 'backend-python', label: 'Python' },
                    { value: 'backend-rust', label: 'Rust' },
                  ],
                },
              ]}
            />
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §44 Cascader                                      */}
      {/* ================================================ */}
      <Section id="cascader" title="§44 Cascader" description="级联选择，按多列路径逐级选择。">
        <Row label="选择地区">
          <div className={styles.w260}>
            <Cascader
              value={cascaderValue}
              onChange={setCascaderValue}
              options={[
                {
                  value: 'china',
                  label: '中国',
                  children: [
                    {
                      value: 'guangdong',
                      label: '广东',
                      children: [
                        { value: 'guangzhou', label: '广州' },
                        { value: 'shenzhen', label: '深圳' },
                      ],
                    },
                    {
                      value: 'zhejiang',
                      label: '浙江',
                      children: [{ value: 'hangzhou', label: '杭州' }],
                    },
                  ],
                },
                {
                  value: 'japan',
                  label: '日本',
                  children: [{ value: 'tokyo', label: '东京' }],
                },
              ]}
            />
          </div>
        </Row>
      </Section>
    </div>
  );
}
