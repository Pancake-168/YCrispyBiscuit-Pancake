# 🛠️ YCrispBiscuit-Tools

> 依酥饼的工具库 - 一个功能丰富的个人工具集合

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.13.5-blue.svg)](https://www.python.org/)
[![Vue](https://img.shields.io/badge/Vue-3.5.13-green.svg)](https://vuejs.org/)

## 📋 项目概述

个人网站项目，专注于二次元相关内容的开发。这是一个长期项目，会逐渐补充各种有趣的功能，未来的发展方向充满可能性！

## 🚀 技术栈

<table>
  <tr>
    <td><strong>🔧 后端</strong></td>
    <td>
      <img src="https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white" alt="FastAPI">
      <img src="https://img.shields.io/badge/Python-3.13.5-3776AB?style=flat&logo=python&logoColor=white" alt="Python">
    </td>
  </tr>
  <tr>
    <td><strong>🎨 前端</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Vue.js-3.5.13-4FC08D?style=flat&logo=vue.js&logoColor=white" alt="Vue.js">
      <img src="https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite">
      <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
    </td>
  </tr>
  <tr>
    <td><strong>🗄️ 数据库</strong></td>
    <td>
      <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql&logoColor=white" alt="MySQL">
    </td>
  </tr>
</table>

## 🚀 快速开始

### 📋 环境要求

- Python 3.13.5+
- Node.js 18+ (推荐 v22.15.0+)
- MySQL 8.0+

> 温馨提示：项目为前后端分离架构，请分别在前端和后端对应的根目录打开项目，不要将前后端内置于同一vscode窗体中。

### 🔧 后端设置

1. **创建虚拟环境**
   ```bash
   python -m venv venv
   ```

2. **安装依赖**
   ```bash
   .\venv\Scripts\pip.exe install -r requirements.txt
   ```

3. **启动后端**
   运行和调试中选择“正式运行”

### 🎨 前端设置

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动前端**
   ```bash
   npm run dev
   ```

### 🗄️ 数据库设置

1. **导入数据库文件**
   - 将 `Database` 目录中的文件导入到 MySQL

2. **配置数据库连接**
   - 编辑 `Server/YCrispBiscuit-Tools-Server/app/core/config.py`
   - 修改数据库连接信息（用户名、密码、数据库名等）

## 📂 项目结构

```
YCrispBiscuit-Tools/
├── 📁 Client/
│   └── YCrispBiscuit-Tools-Client/    # Vue3 前端项目
│       ├── src/                       # 源代码
│       ├── package.json               # 依赖配置
│       └── vite.config.ts            # Vite 配置
├── 📁 Database/                       # 数据库文件
│   └── *.sql                         # 数据库脚本
└── 📁 Server/
    └── YCrispBiscuit-Tools-Server/   # FastAPI 后端项目
        ├── app/                      # 应用代码
        ├── resources/                # 图片资源
        └── requirements.txt          # Python 依赖

```

## ✨ 功能特性

### 🎯 已计划功能

- [ ] **ACGN个人喜好表生成器**
- [ ] **功能模块 2** - 敬请期待
- [ ] **功能模块 3** - 敬请期待

### 🔮 未来计划

这是一个长期项目，会根据个人兴趣和需求不断添加新功能。如果你有好的建议，欢迎提出！

## 🤝 贡献指南

欢迎所有形式的贡献！

- 🐛 **Bug 报告**: 发现问题请创建 Issue
- 💡 **功能建议**: 有好想法就提出来吧
- 🔧 **代码贡献**: 欢迎提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证，详情请查看 [LICENSE](LICENSE) 文件。

## 👨‍💻 作者

- **依酥饼** - *项目创建者与维护者*

---

<div align="center">

⭐ **如果这个项目对你有帮助，请给它一个星标！** ⭐

*Made with ❤️ by 依酥饼*

</div>