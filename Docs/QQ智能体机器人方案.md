# QQ 智能体机器人方案

> 目标：构建一个具备长期记忆的 QQ 群聊/私聊 AI 智能体，核心参考 MaiBot（麦麦 MaiSaka）。
> 核心理念：「最像人，而不是最好用」——自然对话风格、读气氛、持续学习、深度了解用户。

---

## 〇、推荐路线：先做纯对话核心，后接 QQ

QQ 消息接入是展示层，长期记忆才是产品的核心价值。建议分两步走：

### 第〇阶段：纯对话 + 记忆核心（5-8 周）

不碰 QQ，先在一个最简环境里把对话和记忆系统做透。

**范围：**
- 最简交互界面（命令行或最简 Web 聊天窗口）
- LLM 对话引擎（人设 Prompt + 硅基流动 API）
- 短期记忆（会话窗口上下文）
- **长期记忆系统全栈**：向量检索 + 人物画像 + 自动写回 + Episode + 知识图谱 + 记忆维护

**优势：**
- 调试效率极高——终端直接聊，随时看日志、检索结果、画像变化
- 先验证记忆效果，再决定要不要继续投入 QQ 适配
- 记忆核心与展示层解耦，后续接 QQ/微信/Web 都是套壳

**时间：**

| 阶段 | 内容 | 时间 |
|------|------|------|
| 项目骨架 + LLM 接入 | FastAPI 搭建 + 硅基流动对接 + 人设 Prompt | 1-2 天 |
| 基础对话 | 命令行或最简 Web 聊天 | 1 天 |
| 短期记忆 | 会话窗口 + 上下文拼接 | 1 天 |
| 长期记忆（核心） | 向量检索 + 画像 + 自动写回 + Episode + 知识图谱 + 维护 | 4-6 周 |
| 打磨调优 | 记忆效果验证、边界情况处理 | 1 周 |

### 第一阶段：接 QQ（在第〇阶段完成后，额外 2-3 周）

在第〇阶段验证通过的记忆核心基础上，加上 QQ 消息接入层，变成一个真正的 QQ 机器人。

**新增工作：**
- NapCat + OneBot 协议对接
- CQ 码处理、群聊/私聊路由
- 消息管道（去重/意图判断/频率控制）
- 真实群聊环境调试

### 后续阶段（1-2 周）

人格进化：发言时机判断、风格模仿、黑话学习、情绪感知。

---

## 一、QQ 版整体架构（第一阶段目标）

```
┌─────────────────────────────────────────────┐
│                  QQ 客户端（NTQQ）             │
│               NapCat 协议适配层                │
│            OneBot v11 事件/API                │
└──────────────────┬──────────────────────────┘
                   │ WebSocket (正向/反向)
┌──────────────────▼──────────────────────────┐
│            消息接入层 (Adapter)                │
│   - OneBot v11 协议解析                       │
│   - CQ 码处理（图片、表情、@、回复）            │
│   - 群聊/私聊消息路由                          │
│   - 频率控制 & 消息队列                        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              消息管道 (Pipeline)               │
│   - 预处理（去重、过滤、敏感词）                │
│   - 意图判断（需要回复？主动插话？）            │
│   - 上下文装配（短期记忆 + 长期记忆检索结果）    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              LLM 对话引擎 (Core)               │
│   - 多模型支持（OpenAI / 本地模型）             │
│   - 人设 Prompt 管理                          │
│   - 对话生成 & 流式输出                        │
│   - 发言时机决策                               │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          长期记忆系统 (A-Memorix)              │
│   ┌─────────────────────────────────────┐   │
│   │ 短期记忆    │ 当前对话窗口（最近N条）    │   │
│   │ 人物画像    │ 每用户档案（偏好/风格/事实）│   │
│   │ 长期记忆    │ 向量检索 + 关键词检索       │   │
│   │ Episode    │ 对话片段整理为"经历"        │   │
│   │ 知识图谱    │ 实体-关系图                 │   │
│   │ 自动写回    │ 提取事实 + 摘要 → 写回记忆  │   │
│   │ 记忆维护    │ 合并/衰减/强化/遗忘         │   │
│   └─────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              数据持久层                        │
│   - SQLite（结构化数据：用户/群/消息/画像）     │
│   - 向量数据库（ChromaDB / Milvus Lite）       │
│   - 文件存储（图片/表情包缓存）                 │
└─────────────────────────────────────────────┘
```

---

## 二、技术栈

| 层 | 选型 | 说明 |
|----|------|------|
| 语言 | Python 3.12+ | 生态成熟，LLM/向量库支持好 |
| Web 框架 | FastAPI | 异步支持好，WebSocket 原生，MaiBot 同款 |
| ORM | SQLModel | Pydantic + SQLAlchemy，类型安全 |
| 向量数据库 | ChromaDB | 零配置，Python 原生，轻量部署 |
| LLM & Embedding 提供商 | **硅基流动（SiliconFlow）** | 统一 API 接入，OpenAI 兼容接口，模型全更新快 |
| 对话模型 | 硅基流动最新中文旗舰模型 | 按需切换：日常闲聊用便宜的，事实提取/摘要等复杂任务用推理强的 |
| Embedding 模型 | 硅基流动托管的最新中文 Embedding 模型 | API 调用，无需本地部署 |
| QQ 协议 | NapCat + OneBot v11 | MaiBot 同款，NTQQ 内核，活跃维护 |
| 消息格式 | CQ 码 | OneBot 标准，处理图片/表情/@/回复 |
| 配置管理 | TOML | 可读性好，支持热重载 |
| 日志 | structlog | 结构化日志，支持多输出通道 |
| 依赖管理 | uv | 速度快，lock 文件可靠 |

---

## 三、项目目录结构

```
qq-companion-bot/
├── bot.py                 # 入口：启动 bot
├── pyproject.toml         # 项目配置 & 依赖
├── requirements.txt       # 依赖锁文件
├── config/
│   ├── bot.toml           # Bot 基础配置（QQ号、群列表、触发方式）
│   └── model.toml         # 硅基流动 API 配置（API Key、对话模型、Embedding 模型）
├── src/
│   ├── __init__.py
│   ├── adapter/           # 消息接入层
│   │   ├── __init__.py
│   │   ├── onebot.py      # OneBot v11 协议实现
│   │   ├── message.py     # 消息模型（群聊/私聊/CQ码解析）
│   │   └── connection.py  # WebSocket 连接管理（正向/反向）
│   ├── pipeline/          # 消息管道
│   │   ├── __init__.py
│   │   ├── router.py      # 消息路由 & 预处理
│   │   ├── intent.py      # 意图判断（需回复/主动插话/忽略）
│   │   └── assembler.py   # 上下文装配
│   ├── core/              # LLM 对话引擎
│   │   ├── __init__.py
│   │   ├── engine.py      # LLM 调用封装（OpenAI 兼容接口，对接硅基流动）
│   │   ├── persona.py     # 人设 Prompt 管理
│   │   └── timing.py      # 发言时机决策
│   ├── memory/            # 长期记忆系统
│   │   ├── __init__.py
│   │   ├── short_term.py  # 短期记忆（会话窗口）
│   │   ├── long_term.py   # 长期记忆（向量检索）
│   │   ├── profile.py     # 人物画像管理
│   │   ├── episode.py     # Episode 记忆
│   │   ├── graph.py       # 知识图谱
│   │   ├── writeback.py   # 自动写回（事实提取 + 摘要生成）
│   │   ├── maintenance.py # 记忆维护（合并/衰减/强化）
│   │   └── embedding.py   # Embedding 统一接口
│   ├── models/            # 数据库模型
│   │   ├── __init__.py
│   │   ├── user.py        # 用户表
│   │   ├── group.py       # 群表
│   │   ├── message.py     # 消息记录表
│   │   ├── memory.py      # 记忆表
│   │   └── profile.py     # 画像表
│   ├── plugins/           # 插件系统
│   │   ├── __init__.py
│   │   ├── loader.py      # 插件加载器
│   │   └── builtin/       # 内置插件
│   │       ├── __init__.py
│   │       ├── admin.py   # 管理命令
│   │       └── fun.py     # 娱乐功能
│   └── utils/             # 工具
│       ├── __init__.py
│       ├── logger.py      # 日志配置
│       └── config.py      # 配置加载 & 热重载
├── data/                  # 运行时数据
│   └── a-memorix/         # 记忆持久化目录
├── prompts/               # Prompt 模板
│   ├── persona.txt        # 人设 Prompt
│   ├── extract_facts.txt  # 事实提取 Prompt
│   ├── summarize.txt      # 摘要生成 Prompt
│   └── profile.txt        # 画像更新 Prompt
└── tests/                 # 测试
    └── ...
```

---

## 四、核心模块设计

### 4.1 消息接入层（Adapter）

**功能：**
- 对接 OneBot v11 协议，支持正向 WS（bot 主动连 NapCat）和反向 WS（NapCat 连 bot）
- 解析 CQ 码：`[CQ:image]`、`[CQ:face]`、`[CQ:at]`、`[CQ:reply]`
- 区分消息类型：群聊消息、私聊消息、事件通知（加群/退群/禁言等）
- 频率控制：每人/每群最小发言间隔，防止刷屏

**关键实现点：**
- 心跳保活机制，断线自动重连
- 消息队列缓冲，削峰填谷
- 多群并发处理，每个群独立上下文

### 4.2 消息管道（Pipeline）

**流程：**
```
收到消息 → 去重检查 → 敏感词过滤 → 意图判断
    ├── 不需要回复 → 静默（但仍提取记忆）
    ├── @机器人 → 强制回复
    ├── 主动插话 → 概率判断（基于话题相关度 + 活跃度）
    └── 忽略 → 丢弃
```

**意图判断策略：**
- `@机器人` 消息：必定回复
- 私聊消息：必定回复
- 群聊中提及机器人名字/昵称：高概率回复
- 群聊中接在机器人发言后面：较高概率回复
- 群聊中话题与记忆高度相关：中概率回复
- 纯表情/单字/无意义消息：不回复

### 4.3 LLM 对话引擎（Core）

全部通过**硅基流动 API** 接入，OpenAI 兼容接口，一个 `base_url` + `api_key` 搞定所有模型调用。

**模型策略：**
- 日常闲聊：用硅基流动上性价比最高的中文对话模型
- 复杂任务（事实提取/摘要生成/画像更新）：用推理能力最强的旗舰模型
- Embedding：用硅基流动托管的最新中文 Embedding 模型

**人设 Prompt 结构：**
```
[系统设定] → 你是谁、性格、说话风格、底线
[人物画像] → 当前对话对象的画像摘要（动态注入）
[长期记忆] → 检索到的相关历史记忆（动态注入）
[短期记忆] → 最近 N 条对话记录
[当前消息] → 用户刚发的消息
```

**关键设计：**
- 人设 Prompt 模板化，可切换不同性格
- 每次请求动态注入相关记忆（向量检索 top-K）
- 流式输出支持（SSE → 分段发送，避免 QQ 消息过长）
- Token 预算管理，控制上下文长度
- 对话模型和 Embedding 模型统一走硅基流动，无需维护两套 API

### 4.4 长期记忆系统（A-Memorix） ★ 核心

这是整个项目差异化能力的关键。MaiBot 的记忆系统包含以下层次：

#### 4.4.1 短期记忆
- 每个用户/每个群维护最近 20-50 条对话的滑动窗口
- 存在内存中，重启丢失
- 每次调 LLM 时拼入 prompt

#### 4.4.2 人物画像（Profile）
- 每个用户一个画像文档，包含：
  - 基本信息：昵称、称呼、活跃时间、常活跃群
  - 性格特点：说话风格、情绪倾向
  - 偏好：喜欢的话题、讨厌的话题、常用表达
  - 重要事实：记住的关键信息（生日、职业、经历等）
- 画像由 LLM 从对话中自动提取和更新
- 每次回复前检索画像，拼入 prompt

#### 4.4.3 长期记忆（向量检索）
- 存储单元：`{user_id, group_id, content, importance, timestamp, tags}`
- content 通过硅基流动的 Embedding 接口生成向量，存入 ChromaDB
- 检索策略：
  - 语义检索：当前消息 → 调硅基流动 Embedding API → 向量相似度 top-K
  - 关键词检索：提取实体词 → 关键词匹配
  - 混合检索：两种结果加权合并
- 时间衰减：越旧的记忆权重越低（可配置衰减曲线）

#### 4.4.4 Episode 记忆
- 把一段连续对话整理成一个"经历片段"
- 触发条件：话题切换、时间窗口到期、消息数达到阈值
- LLM 生成 Episode 摘要 → embedding → 存入向量库
- 摘要格式：`时间范围 + 参与人 + 话题 + 关键内容 + 结论`

#### 4.4.5 知识图谱
- 节点类型：人、群、话题、事件、概念
- 关系类型：属于、喜欢、讨厌、提及、参与、知道
- 存储：轻量级用 SQLite + JSON 字段，复杂用 Neo4j
- 查询：`用户A 和 话题X 的关系`、`话题X 相关的所有人`

#### 4.4.6 自动写回
- 每次机器人发送回复后，异步触发写回流程：
  1. 事实提取：LLM 从本轮对话中提取稳定的人物事实
  2. 摘要生成：LLM 生成对话摘要
  3. 画像更新：新事实合并到人物画像
  4. 向量写入：摘要 embedding 后写入向量库
- 写回频率和触发条件可配置

#### 4.4.7 记忆维护
- 定期任务（每天/每周）：
  - 合并相似记忆（LLM 判断两条记忆是否表达相同意思）
  - 强化重要记忆（被多次检索到的记忆提升权重）
  - 衰减过期记忆（长时间未被检索的记忆降低权重）
  - 遗忘标记（超过阈值的低权重记忆标记为"遗忘"）

---

## 五、数据库设计

### SQLite 表结构（核心表）

```sql
-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qq_id VARCHAR(20) UNIQUE NOT NULL,     -- QQ号
    nickname VARCHAR(100),                  -- 当前QQ昵称
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 群表
CREATE TABLE groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id VARCHAR(20) UNIQUE NOT NULL,   -- 群号
    group_name VARCHAR(200),                -- 群名
    enabled BOOLEAN DEFAULT TRUE,           -- 是否启用
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 群成员关系表
CREATE TABLE group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    nickname_in_group VARCHAR(100),         -- 群昵称
    UNIQUE(group_id, user_id)
);

-- 消息记录表
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    msg_id VARCHAR(50) UNIQUE,              -- 消息唯一ID
    user_id VARCHAR(20) NOT NULL,           -- 发送者QQ号
    group_id VARCHAR(20),                   -- 群号（私聊为NULL）
    content TEXT NOT NULL,                  -- 原始消息内容
    clean_content TEXT,                     -- 清洗后的纯文本
    msg_type VARCHAR(20) DEFAULT 'text',    -- text/image/mixed
    is_bot_reply BOOLEAN DEFAULT FALSE,     -- 是否机器人回复
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 人物画像表
CREATE TABLE user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(20) UNIQUE NOT NULL,
    profile_json TEXT NOT NULL DEFAULT '{}', -- 画像JSON（结构化存储）
    version INTEGER DEFAULT 1,              -- 画像版本号
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 记忆表
CREATE TABLE memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memory_id VARCHAR(50) UNIQUE NOT NULL,   -- 记忆唯一ID
    user_id VARCHAR(20),                     -- 关联用户（可为NULL表示群级记忆）
    group_id VARCHAR(20),                    -- 关联群（可为NULL表示个人记忆）
    content TEXT NOT NULL,                   -- 记忆内容
    memory_type VARCHAR(30) DEFAULT 'fact',  -- fact/episode/knowledge
    importance REAL DEFAULT 0.5,             -- 重要性 0-1
    access_count INTEGER DEFAULT 0,          -- 被检索次数
    last_access_at TIMESTAMP,               -- 最后被检索时间
    decay_factor REAL DEFAULT 1.0,          -- 衰减因子
    status VARCHAR(20) DEFAULT 'active',     -- active/forgotten/archived
    source_msg_ids TEXT,                     -- 来源消息ID列表（JSON数组）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Episode 表
CREATE TABLE episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    episode_id VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(20),                     -- 参与者
    group_id VARCHAR(20),                    -- 发生群
    title VARCHAR(500),                      -- 片段标题
    summary TEXT NOT NULL,                   -- 摘要内容
    start_time TIMESTAMP,                    -- 起始时间
    end_time TIMESTAMP,                      -- 结束时间
    participant_ids TEXT,                    -- 参与人列表（JSON数组）
    topic_tags TEXT,                         -- 话题标签（JSON数组）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 知识图谱节点表
CREATE TABLE graph_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,              -- 节点名称
    node_type VARCHAR(30) NOT NULL,          -- person/group/topic/event/concept
    properties TEXT DEFAULT '{}',            -- 属性（JSON）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 知识图谱关系表
CREATE TABLE graph_edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_node_id VARCHAR(50) NOT NULL,
    target_node_id VARCHAR(50) NOT NULL,
    relation_type VARCHAR(50) NOT NULL,      -- likes/dislikes/mentions/belongs_to/knows
    weight REAL DEFAULT 1.0,                 -- 关系强度
    evidence_msg_ids TEXT,                   -- 证据消息ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 六、实施路线图

> 推荐顺序：先做第〇阶段（纯对话核心），验证通过后再接 QQ。详见第〇节说明。

### 第〇阶段：纯对话 + 记忆核心（5-8 周）

**目标：** 在无 QQ 的最简环境中，把对话和长期记忆系统做透

| 任务 | 时间 | 产出 |
|------|------|------|
| 项目骨架搭建 | 1 天 | FastAPI + 目录结构 + 配置加载 |
| 硅基流动 LLM 接入 | 1 天 | OpenAI 兼容接口封装 + 人设 Prompt |
| 基础对话 | 1 天 | 命令行或最简 Web 聊天 |
| 短期记忆 | 1 天 | 会话窗口 + 上下文拼接 |
| 数据库建表 & ORM | 2 天 | SQLModel 全部模型 |
| 向量数据库集成 | 2 天 | ChromaDB 部署 + Embedding 接口 |
| 长期记忆存储 & 检索 | 5 天 | 语义搜索 + 关键词搜索 + 混合检索 |
| 人物画像系统 | 5 天 | 画像提取 + 更新 + 注入 prompt |
| 自动写回 | 5 天 | 事实提取 + 摘要生成 + 异步写回 |
| Episode 记忆 | 3 天 | 对话片段分割 + Episode 生成 |
| 记忆维护 | 3 天 | 合并/衰减/强化定时任务 |
| 知识图谱 | 5 天 | 实体抽取 + 关系构建 + 图查询 |
| 记忆效果打磨 | 5 天 | 全链路调试 + 检索质量调优 + 画像准确性验证 |

### 第一阶段：接 QQ（在第〇阶段完成后，额外 2-3 周）

**目标：** 把已验证的记忆核心接到 QQ 上

| 任务 | 时间 | 产出 |
|------|------|------|
| OneBot 协议对接 | 2 天 | WebSocket 连接 + 消息收发 + CQ码解析 |
| 消息管道 | 2 天 | 群聊/私聊路由 + @触发 + 意图判断 + 频率控制 |
| QQ 适配适配 | 2 天 | 记忆系统对接 QQ 消息、CQ 码清洗 |
| 真实群聊调试 | 5 天 | 多群环境测试 + 边界情况处理 |

### 第二阶段：人格进化（在第〇阶段完成后可选，1-2 周）

**目标：** 更像真人、读气氛、学说话

| 任务 | 时间 | 产出 |
|------|------|------|
| 发言时机判断 | 3 天 | 多信号综合决策 |
| 风格模仿 | 3 天 | 提取说话风格 + prompt 注入 |
| 黑话/新词学习 | 2 天 | 生词检测 + 上下文推断 |
| 情绪感知 | 2 天 | 消息情绪分析 + 回复情绪匹配 |

### 第三阶段：打磨上线（1 周）

| 任务 | 时间 |
|------|------|
| 管理命令（记忆查询/删除/状态查看） | 2 天 |
| 异常恢复（断线重连/LLM超时降级） | 2 天 |
| 日志 & 监控 | 1 天 |

---

## 七、关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 主动插话 or 纯响应式 | **混合模式**：@必回 + 概率主动插话 | 纯响应式太被动，纯主动太骚扰 |
| 记忆写回时机 | **异步**：发送回复后触发 | 不阻塞用户感知的响应速度 |
| 多群记忆隔离 | **默认隔离 + 可配置共享** | 不同群的机器人人格可以不同 |
| 记忆检索条数 | **top-5 语义 + top-3 关键词** | 太少不够，太多 token 超预算 |
| 画像更新策略 | **增量合并**：新事实与旧画像 LLM 合并 | 避免覆盖丢失旧信息 |
| LLM & Embedding | **全部走硅基流动 API** | 统一 OpenAI 兼容接口，无需本地部署，模型全更新快 |

---

## 八、风险与注意事项

1. **QQ 封号风险**：NapCat 基于 NTQQ 官方客户端，相对安全，但仍有被检测风险。建议使用小号。
2. **API 成本**：硅基流动价格低廉，但仍需做好 Token 预算、语义缓存避免重复 embedding。
3. **记忆膨胀**：长期运行后记忆量暴增，检索变慢。需要做好记忆衰减和定期清理。
4. **隐私问题**：机器人在群里能看到所有消息，需在隐私协议中说明记忆范围和使用方式。
5. **回复延迟**：LLM 调用 + 记忆检索可能耗时 2-5 秒，需考虑用户体验（发送"正在输入"状态）。

---

## 九、参考资源

- [MaiBot (麦麦 MaiSaka)](https://github.com/Mai-with-u/MaiBot) — 核心参考项目
- [NapCat](https://github.com/NapNeko/NapCatQQ) — QQ 协议适配
- [OneBot v11 标准](https://github.com/botuniverse/onebot-11) — 消息协议
- [ChromaDB](https://www.trychroma.com/) — 向量数据库
- [MaiBot 记忆系统文档](https://docs.mai-mai.org/manual/features/memory-system) — 记忆设计参考
