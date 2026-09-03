// 全局统一 Icon 清单
// 所有页面/组件需要图标时，必须从这里按语义取，禁止在业务代码中直接写 react-icons。
import type { ReactNode } from 'react';
import { MdDarkMode, MdKeyboardArrowDown, MdKeyboardArrowUp, MdLightMode } from 'react-icons/md';
import { SiQq } from 'react-icons/si';
import {
  VscAdd,
  VscBell,
  VscCalendar,
  VscCheck,
  VscChevronDown,
  VscChevronLeft,
  VscChevronRight,
  VscChromeClose,
  VscChromeMaximize,
  VscChromeMinimize,
  VscChromeRestore,
  VscClose,
  VscCloudDownload,
  VscCopy,
  VscEdit,
  VscError,
  VscFileMedia,
  VscFolder,
  VscFolderLibrary,
  VscFolderOpened,
  VscGithub,
  VscHome,
  VscInfo,
  VscPerson,
  VscQuestion,
  VscRefresh,
  VscSearch,
  VscSettingsGear,
  VscStarFull,
  VscTrash,
  VscWarning,
} from 'react-icons/vsc';

const ICONS = {
  add: VscAdd,
  bell: VscBell,
  calendar: VscCalendar,
  check: VscCheck,
  chevronDown: VscChevronDown,
  chevronLeft: VscChevronLeft,
  chevronRight: VscChevronRight,
  chromeClose: VscChromeClose,
  chromeMaximize: VscChromeMaximize,
  chromeMinimize: VscChromeMinimize,
  chromeRestore: VscChromeRestore,
  close: VscClose,
  cloudDownload: VscCloudDownload,
  copy: VscCopy,
  darkMode: MdDarkMode,
  edit: VscEdit,
  error: VscError,
  fileMedia: VscFileMedia,
  folder: VscFolder,
  folderLibrary: VscFolderLibrary,
  folderOpened: VscFolderOpened,
  github: VscGithub,
  home: VscHome,
  info: VscInfo,
  keyboardArrowDown: MdKeyboardArrowDown,
  keyboardArrowUp: MdKeyboardArrowUp,
  lightMode: MdLightMode,
  person: VscPerson,
  qq: SiQq,
  question: VscQuestion,
  refresh: VscRefresh,
  search: VscSearch,
  settingsGear: VscSettingsGear,
  starFull: VscStarFull,
  trash: VscTrash,
  warning: VscWarning,
} as const;

export type IconName = keyof typeof ICONS;

export function getIcon(name: IconName, size = 16, className?: string): ReactNode {
  const Component = ICONS[name];
  return <Component size={size} className={className} />;
}
