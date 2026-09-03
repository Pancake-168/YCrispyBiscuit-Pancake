import { useState } from 'react';
import { createLogger } from '@/utils/logger';
import {
  Accordion,
  AlertDialog,
  AspectRatio,
  Avatar,
  Button,
  Checkbox,
  Collapsible,
  Confirm,
  ContextMenu,
  Dialog,
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
  ScrollArea,
  Select,
  Separator,
  Skeleton,
  Slider,
  Slot,
  Switch,
  Tabs,
  Textarea,
  Toggle,
  Tooltip,
  VisuallyHidden,
  toast,
} from '@/components/common';
import type { MenuItem } from '@/components/common';
import {
  VscHome,
  VscGithub,
  VscSettingsGear,
  VscEdit,
  VscTrash,
  VscCopy,
  VscInfo,
  VscError,
  VscAdd,
  VscSearch,
  VscRefresh,
  VscPerson,
  VscBell,
} from 'react-icons/vsc';

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
    <section
      id={id}
      style={{
        marginBottom: 'var(--spacing-2xl)',
        padding: 'var(--spacing-xl)',
        border: '1px solid var(--glass-brd)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--glass)',
        backdropFilter: 'blur(var(--blur-panel))',
      }}
    >
      <h2
        style={{
          margin: 0,
          marginBottom: 'var(--spacing-xs)',
          fontSize: 'var(--text-md)',
          fontWeight: 700,
          color: 'var(--text)',
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            margin: 0,
            marginBottom: 'var(--spacing-lg)',
            fontSize: 'var(--text-sm)',
            color: 'var(--muted)',
          }}
        >
          {description}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {children}
      </div>
    </section>
  );
}

/** 行内示例容器 */
function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}
    >
      {label && (
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', minWidth: 80 }}>
          {label}
        </span>
      )}
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
      icon: <IconContainer size={14} src={<VscEdit size={14} />} />,
      shortcut: '⌘E',
      onClick: () => toast('点击了编辑', 'info'),
    },
    {
      label: '复制',
      icon: <IconContainer size={14} src={<VscCopy size={14} />} />,
      shortcut: '⌘C',
      onClick: () => toast('已复制', 'success'),
    },
    {
      label: '刷新',
      icon: <IconContainer size={14} src={<VscRefresh size={14} />} />,
      onClick: () => toast('已刷新', 'success'),
    },
    { label: '', separator: true as const },
    {
      label: '删除',
      icon: <IconContainer size={14} src={<VscTrash size={14} />} />,
      danger: true,
      onClick: () => toast('删除操作需确认', 'warn'),
    },
  ];

  // ---- ContextMenu 菜单项 ----
  const contextMenuItems: MenuItem[] = [
    {
      label: '查看详情',
      icon: <IconContainer size={14} src={<VscInfo size={14} />} />,
      onClick: () => toast('查看详情', 'info'),
    },
    {
      label: '复制文本',
      icon: <IconContainer size={14} src={<VscCopy size={14} />} />,
      shortcut: '⌘C',
      onClick: () => toast('已复制', 'success'),
    },
    { label: '', separator: true as const },
    {
      label: '删除',
      icon: <IconContainer size={14} src={<VscTrash size={14} />} />,
      danger: true,
      onClick: () => toast('已删除', 'error'),
    },
  ];

  // ---- Tabs ----
  const demoTabs = [
    {
      id: 'tab-1',
      label: '概览',
      icon: <IconContainer size={14} src={<VscHome size={14} />} />,
      content: (
        <p style={{ color: 'var(--text)', fontSize: 'var(--text-base)' }}>这是概览标签页的内容。</p>
      ),
    },
    {
      id: 'tab-2',
      label: '设置',
      icon: <IconContainer size={14} src={<VscSettingsGear size={14} />} />,
      content: (
        <p style={{ color: 'var(--text)', fontSize: 'var(--text-base)' }}>这是设置标签页的内容。</p>
      ),
    },
    {
      id: 'tab-3',
      label: '通知',
      icon: <IconContainer size={14} src={<VscBell size={14} />} />,
      content: (
        <p style={{ color: 'var(--text)', fontSize: 'var(--text-base)' }}>这是通知标签页的内容。</p>
      ),
    },
  ];

  // ---- ScrollArea 示例长文本 ----
  const scrollContent = Array.from({ length: 20 }, (_, i) => (
    <p
      key={i}
      style={{
        color: 'var(--text)',
        fontSize: 'var(--text-sm)',
        margin: 0,
        padding: 'var(--spacing-sm) 0',
      }}
    >
      第 {i + 1} 行：这是一段用于演示滚动区域的示例文本内容。
    </p>
  ));

  // ============================================================
  // 渲染
  // ============================================================

  return (
    <div
      style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: 'var(--spacing-2xl) var(--spacing-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-xl)',
      }}
    >
      {/* 页面标题 */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--text)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          Common 组件示例
        </h1>
        <p
          style={{
            margin: 0,
            marginTop: 'var(--spacing-sm)',
            color: 'var(--muted)',
            fontSize: 'var(--text-sm)',
          }}
        >
          共 34 个基础组件，一一展示常规用法
        </p>
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
          <Button variant="primary" icon={<IconContainer size={14} src={<VscAdd size={14} />} />}>
            新建
          </Button>
          <Button
            variant="secondary"
            icon={<IconContainer size={14} src={<VscSearch size={14} />} />}
          >
            搜索
          </Button>
          <Button variant="subtle" icon={<IconContainer size={14} src={<VscEdit size={14} />} />}>
            编辑
          </Button>
          <Button variant="danger" icon={<IconContainer size={14} src={<VscTrash size={14} />} />}>
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
          <IconContainer size={40} shape="rounded" src={<VscGithub size={22} />} />
          <IconContainer size={40} shape="circle" src={<VscHome size={20} />} />
          <IconContainer size={40} shape="rounded" src={<VscPerson size={22} />} />
        </Row>
        <Row label="加载失败 fallback">
          <IconContainer size={48} shape="rounded" src="/nonexistent.png" alt="不存在的图片" />
          <IconContainer
            size={48}
            shape="circle"
            src="/nonexistent.png"
            alt="不存在的图片"
            fallback={<VscError size={22} />}
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
            style={{ width: 260 }}
          />
        </Row>
        <Row label="带标签">
          <Input
            value={inputValue}
            onChange={setInputValue}
            label="用户名"
            placeholder="请输入用户名"
            style={{ width: 260 }}
          />
        </Row>
        <Row label="辅助说明">
          <Input
            value={inputValue}
            onChange={setInputValue}
            label="邮箱"
            helper="请输入有效的邮箱地址"
            placeholder="example@mail.com"
            style={{ width: 260 }}
          />
        </Row>
        <Row label="错误状态">
          <Input
            value={inputErrorValue}
            onChange={setInputErrorValue}
            label="密码"
            error="密码长度不能少于 8 位"
            type="password"
            style={{ width: 260 }}
          />
        </Row>
        <Row label="禁用">
          <Input value="不可编辑" onChange={() => {}} disabled style={{ width: 260 }} />
        </Row>
        <Row label="数字">
          <Input value="42" onChange={() => {}} label="数量" type="number" style={{ width: 160 }} />
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
            style={{ width: 320 }}
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
            style={{ width: 320 }}
          />
        </Row>
        <Row label="错误状态">
          <Textarea
            value=""
            onChange={() => {}}
            label="必填项"
            error="此字段为必填项"
            placeholder="请输入..."
            style={{ width: 320 }}
          />
        </Row>
        <Row label="禁用">
          <Textarea
            value="这是一段只读的文本内容。"
            onChange={() => {}}
            disabled
            style={{ width: 320 }}
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
            <div
              style={{
                padding: 'var(--spacing-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
                minWidth: 220,
              }}
            >
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
            <div
              style={{
                padding: 'var(--spacing-lg)',
                color: 'var(--text)',
                fontSize: 'var(--text-sm)',
              }}
            >
              这是一个开头对齐的卡片
            </div>
          </Popover>
          <Popover
            trigger={<Button variant="subtle">居中对齐</Button>}
            side="bottom"
            align="center"
          >
            <div
              style={{
                padding: 'var(--spacing-lg)',
                color: 'var(--text)',
                fontSize: 'var(--text-sm)',
              }}
            >
              这是一个居中对齐的卡片
            </div>
          </Popover>
          <Popover trigger={<Button variant="subtle">末尾对齐</Button>} side="bottom" align="end">
            <div
              style={{
                padding: 'var(--spacing-lg)',
                color: 'var(--text)',
                fontSize: 'var(--text-sm)',
              }}
            >
              这是一个末尾对齐的卡片
            </div>
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
            <div
              style={{
                width: '100%',
                maxWidth: 400,
                padding: 'var(--spacing-xl)',
                border: '2px dashed var(--glass-brd)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: 'var(--text-sm)',
                cursor: 'context-menu',
              }}
            >
              在此区域右键点击查看菜单
            </div>
          </ContextMenu>
        </Row>
        <Row label="禁用右键">
          <ContextMenu items={contextMenuItems} disabled>
            <div
              style={{
                width: '100%',
                maxWidth: 400,
                padding: 'var(--spacing-xl)',
                border: '2px dashed var(--glass-brd)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: 'var(--text-sm)',
              }}
            >
              此区域右键菜单已禁用
            </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
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
            <p style={{ color: 'var(--text)', fontSize: 'var(--text-sm)' }}>
              弹窗内容区域，可以放置任意组件。
            </p>
          </Dialog>
        </Row>
        <Row label="无 description">
          <Dialog trigger={<Button variant="subtle">简洁弹窗</Button>} title="简洁标题">
            <p style={{ color: 'var(--text)', fontSize: 'var(--text-sm)' }}>
              没有 description 的简洁弹窗。
            </p>
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
            <p style={{ color: 'var(--text)', fontSize: 'var(--text-sm)' }}>
              确定要删除选中的 3 个文件吗？
            </p>
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
            <p style={{ color: 'var(--text)', fontSize: 'var(--text-sm)' }}>
              如果选择不保存，所有未保存的修改将会丢失。
            </p>
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
          <div style={{ width: '100%' }}>
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
          <div style={{ width: '100%' }}>
            <Tabs
              tabs={[
                {
                  id: 'a',
                  label: '标签A',
                  content: <span style={{ color: 'var(--text)' }}>内容 A</span>,
                },
                {
                  id: 'b',
                  label: '标签B',
                  content: <span style={{ color: 'var(--text)' }}>内容 B</span>,
                },
                {
                  id: 'c',
                  label: '标签C',
                  content: <span style={{ color: 'var(--text)' }}>内容 C</span>,
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
          <div style={{ width: '100%', maxWidth: 400 }}>
            <ScrollArea maxHeight={160}>
              <div style={{ paddingRight: 'var(--spacing-md)' }}>{scrollContent}</div>
            </ScrollArea>
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §16 EmptyState                                     */}
      {/* ================================================ */}
      <Section id="emptyState" title="§16 EmptyState" description="空状态占位，列表无数据时显示。">
        <Row label="默认">
          <div style={{ width: '100%', maxWidth: 400 }}>
            <EmptyState title="暂无数据" description="稍后再来看看吧" />
          </div>
        </Row>
        <Row label="带操作按钮">
          <div style={{ width: '100%', maxWidth: 400 }}>
            <EmptyState
              title="还没有收藏"
              description="收藏的内容会显示在这里"
              action={
                <Button
                  variant="primary"
                  icon={<IconContainer size={14} src={<VscAdd size={14} />} />}
                  onClick={() => toast('去发现内容', 'info')}
                >
                  去发现
                </Button>
              }
            />
          </div>
        </Row>
        <Row label="自定义图标">
          <div style={{ width: '100%', maxWidth: 400 }}>
            <EmptyState
              icon={<IconContainer size={48} src={<VscSearch size={48} />} />}
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
          <div style={{ width: 300 }}>
            <Skeleton variant="text" />
          </div>
        </Row>
        <Row label="段落（5行）">
          <div style={{ width: 320 }}>
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
          <div style={{ width: '100%', maxWidth: 420 }}>
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
          <div style={{ width: '100%', maxWidth: 420 }}>
            <Accordion
              type="multiple"
              items={[
                { value: 'multi-1', trigger: '第一项', content: <span>可以同时展开多项。</span> },
                { value: 'multi-2', trigger: '第二项', content: <span>这一项也保持独立开关。</span> },
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
          <div style={{ width: 260 }}>
            <AspectRatio ratio={16 / 9}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--glass)',
                  color: 'var(--muted)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                16:9
              </div>
            </AspectRatio>
          </div>
        </Row>
        <Row label="1:1">
          <div style={{ width: 120 }}>
            <AspectRatio ratio={1}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--glass)',
                  color: 'var(--muted)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                1:1
              </div>
            </AspectRatio>
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §21 Avatar                                         */}
      {/* ================================================ */}
      <Section
        id="avatar"
        title="§21 Avatar"
        description="头像容器，图片加载失败时自动显示 fallback。"
      >
        <Row label="图片头像">
          <Avatar src="https://github.com/fluidicon.png" alt="GitHub" size={48} />
          <Avatar src="https://github.com/fluidicon.png" alt="GitHub" size={32} />
        </Row>
        <Row label="加载失败 fallback">
          <Avatar src="/nonexistent.png" alt="不存在的头像" size={48} />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §22 Checkbox                                       */}
      {/* ================================================ */}
      <Section
        id="checkbox"
        title="§22 Checkbox"
        description="复选框，支持受控勾选与禁用态。"
      >
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
      {/* §23 Collapsible                                    */}
      {/* ================================================ */}
      <Section
        id="collapsible"
        title="§23 Collapsible"
        description="可展开/收起的折叠内容区。"
      >
        <Row label="展开详情">
          <div style={{ width: '100%', maxWidth: 420 }}>
            <Collapsible trigger="查看高级设置">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <Checkbox checked={checkboxChecked} onChange={setCheckboxChecked} label="启用实验功能" />
                <Button variant="subtle" onClick={() => toast('设置已保存', 'success')}>
                  保存设置
                </Button>
              </div>
            </Collapsible>
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §24 HoverCard                                      */}
      {/* ================================================ */}
      <Section
        id="hoverCard"
        title="§24 HoverCard"
        description="鼠标悬停后弹出的信息卡片。"
      >
        <Row label="悬停查看">
          <HoverCard trigger={<Button variant="subtle">悬停查看用户</Button>}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-lg)',
                minWidth: 220,
              }}
            >
              <Avatar src="https://github.com/fluidicon.png" alt="GitHub" size={40} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>Pancake</span>
                <span style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
                  悬停卡片示例
                </span>
              </div>
            </div>
          </HoverCard>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §25 Label                                         */}
      {/* ================================================ */}
      <Section
        id="label"
        title="§25 Label"
        description="表单标签，点击可聚焦关联控件。"
      >
        <Row label="Label + Input">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            <Label htmlFor="demo-label-input">昵称</Label>
            <Input
              id="demo-label-input"
              value={inputValue}
              onChange={setInputValue}
              placeholder="请输入昵称"
              style={{ width: 220 }}
            />
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §26 Menubar                                        */}
      {/* ================================================ */}
      <Section
        id="menubar"
        title="§26 Menubar"
        description="桌面风格顶部菜单栏。"
      >
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
                content: <div style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>帮助面板内容</div>,
              },
            ]}
          />
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §27 NavigationMenu                                */}
      {/* ================================================ */}
      <Section
        id="navigationMenu"
        title="§27 NavigationMenu"
        description="导航菜单，支持普通链接与展开面板。"
      >
        <Row label="导航示例">
          <NavigationMenu
            items={[
              { label: '首页', onClick: () => toast('进入首页', 'info') },
              {
                label: '工具',
                content: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
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
      {/* §28 Progress                                       */}
      {/* ================================================ */}
      <Section
        id="progress"
        title="§28 Progress"
        description="进度条，展示任务完成度。"
      >
        <Row label="普通进度">
          <div style={{ width: '100%', maxWidth: 320 }}>
            <Progress value={65} />
          </div>
        </Row>
        <Row label="接近完成">
          <div style={{ width: '100%', maxWidth: 320 }}>
            <Progress value={92} />
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §29 RadioGroup                                     */}
      {/* ================================================ */}
      <Section
        id="radioGroup"
        title="§29 RadioGroup"
        description="单选组，键盘方向键可切换选项。"
      >
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
      {/* §30 Separator                                      */}
      {/* ================================================ */}
      <Section
        id="separator"
        title="§30 Separator"
        description="横向或纵向视觉分隔线。"
      >
        <Row label="横向">
          <div style={{ width: 200 }}>
            <Separator />
          </div>
        </Row>
        <Row label="纵向">
          <div style={{ height: 48, display: 'flex' }}>
            <Separator orientation="vertical" />
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §31 Slider                                         */}
      {/* ================================================ */}
      <Section
        id="slider"
        title="§31 Slider"
        description="滑块，适合音量、亮度、数值范围等场景。"
      >
        <Row label="受控滑块">
          <div style={{ width: '100%', maxWidth: 320 }}>
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              label="数值"
              min={0}
              max={100}
            />
            <span style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
              当前值：{sliderValue.join(', ')}
            </span>
          </div>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §32 Slot                                           */}
      {/* ================================================ */}
      <Section
        id="slot"
        title="§32 Slot"
        description="把父级 props 合并到子元素上的透传封装。"
      >
        <Row label="Slot 包裹按钮">
          <Slot onClick={() => toast('Slot 事件已合并', 'info')}>
            <Button variant="secondary">点击测试 Slot</Button>
          </Slot>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §33 Toggle                                         */}
      {/* ================================================ */}
      <Section
        id="toggle"
        title="§33 Toggle"
        description="按压态按钮，适合图标开关。"
      >
        <Row label="按压开关">
          <Toggle pressed={togglePressed} onPressedChange={setTogglePressed} aria-label="切换通知">
            <VscBell size={16} />
          </Toggle>
          <span style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
            {togglePressed ? '已开启' : '已关闭'}
          </span>
        </Row>
        <Row label="禁用">
          <Toggle disabled aria-label="禁用切换">
            <VscBell size={16} />
          </Toggle>
        </Row>
      </Section>

      {/* ================================================ */}
      {/* §34 VisuallyHidden                                 */}
      {/* ================================================ */}
      <Section
        id="visuallyHidden"
        title="§34 VisuallyHidden"
        description="视觉隐藏但保留给读屏器访问的内容。"
      >
        <Row label="读屏专用文本">
          <span style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
            下面内容只对读屏器可见：
          </span>
          <VisuallyHidden>这是一段屏幕阅读器可访问但页面不可见的文本。</VisuallyHidden>
        </Row>
      </Section>
    </div>
  );
}
