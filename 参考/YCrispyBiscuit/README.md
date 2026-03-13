# YCrispyBiscuit 全栈项目

##  项目结构

```plaintext
YCrispyBiscuit/
├── Client/                 # 前端客户端 
│   └── Vue/                # Vue 3 + Vite + TS
├── Server/                 # 后端服务端
│   └── Python-FastAPI/     # 高性能异步 Python API
├── Database/               # 数据库相关
│   └── MYSQL/              # SQL 脚本与配置
└── README.md               # 本文档
```


---

##  快速开始

### 1. 环境准备
确保你本地已安装以下工具：
- [Node.js](https://nodejs.org/) (推荐 v20+)
- [Python 3.10+](https://www.python.org/)
- [MySQL 8.0+](https://www.mysql.com/)

### 2. 数据库配置
在 `Database/MYSQL/` 目录下运行初始化脚本，并在对应的后端 `.env` 文件中配置数据库连接字符串。

### 3. 各模块启动指南

#### 前端 - Vue
```bash
cd Client/React/ycrispybiscuit # 或 Vue 目录
npm install
npm run dev
```

#### 后端 - Python-FastAPI
```bash
cd Server/Python-FastAPI
npm install
npm run dev
```

---

##  项目规则
- **配置文件**: `.env` 文件版本已设为**不忽略**，请在本地修改后谨慎提交，不要上传真实生产密钥。
- **测试环境**: 本项目已移除默认的测试模板（Jest/JUnit/spec），保持代码极致简洁，适合直接进行业务开发。
