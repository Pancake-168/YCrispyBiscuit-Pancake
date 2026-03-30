const zhCN = {
  translation: {
    nav: {
      home: "首页",
      settings: "设置",
    },
    layout: {
      brand: "Pancake",
      eyebrow: "React + Router + Store + i18n",
      title: "基础应用壳已接入",
      toggleSidebarExpand: "展开导航",
      toggleSidebarCollapse: "收起导航",
      themeLabel: "主题",
      languageLabel: "语言",
      themeValuePink: "浅粉",
      themeValueBlue: "浅蓝",
      languageValueZhCN: "简体中文",
      languageValueEnUS: "English",
    },
    home: {
      eyebrow: "Home",
      title: "路由、主题和国际化已经生效",
      description:
        "当前项目已经具备路由、全局状态、两套主题和多语言基础设施，后续可以直接在业务模块中复用。",
      featureTitle: "推荐目录约定",
      featureDescription:
        "建议继续按 views、stores、services、types、utils、language、styles 的层级扩展，保持业务边界清晰。",
      featureItemRouter: "路由集中在 router 目录统一维护",
      featureItemStore: "状态统一放在 stores 并做持久化",
      featureItemTheme: "所有颜色只通过全局主题变量控制",
      featureItemI18n: "文案统一从 i18n 资源文件读取",
    },
    settings: {
      eyebrow: "Settings",
      title: "偏好设置",
      description: "这里的主题和语言切换都走全局 store，并会持久化保存。",
      sidebarExpanded: "当前导航状态：已展开",
      sidebarCollapsed: "当前导航状态：已收起",
      themeSectionTitle: "主题模式",
      themeSectionDescription:
        "当前只保留两套浅色主题，分别是浅粉和浅蓝，不再提供深色模式。",
      languageSectionTitle: "界面语言",
      languageSectionDescription:
        "切换后会立即同步到当前界面和 document 语言属性。",
      themePinkName: "浅粉主题",
      themePinkDesc: "暖白底配柔和粉色强调，适合更轻盈的界面气质。",
      themeBlueName: "浅蓝主题",
      themeBlueDesc: "冷白底配清透蓝色强调，整体更清爽偏产品化。",
      languageZhCN: "简体中文",
      languageEnUS: "English",
      currentTheme: "当前主题：{{theme}}",
      currentLanguage: "当前语言：{{language}}",
    },
    mainPage: {title:"主页面"}
  },
};

export default zhCN;
