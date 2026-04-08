# Pancake FastAPI Alembic 使用说明

这份文档只讲一件事：

如何在这个后端项目里正确使用 Alembic 管理数据库表结构。

如果你完全不懂 Alembic，也可以按下面步骤直接照做。

## 1. 先说明现在已经改了什么

这个后端现在已经接入了 Alembic，相关文件在下面这些位置：

- `alembic.ini`
- `alembic/env.py`
- `alembic/script.py.mako`
- `alembic/versions/20260407_0001_init_users_table.py`

同时，应用启动时的自动建表已经改成了配置开关控制：

- 开发环境：`DATABASE_AUTO_CREATE=true`
- 生产环境：`DATABASE_AUTO_CREATE=false`

也就是说：

- 开发环境可以临时自动建表
- 生产环境默认不自动建表
- 正常做法应该逐步改成只用 Alembic 维护表结构

## 2. 你现在的数据库是什么状态

我已经检查过你本机的开发库 `pancake`。

当前状态是：

1. 数据库里已经有 `users` 表。
2. Alembic 还没有给这个数据库登记版本号。

所以你现在**不能直接执行升级迁移**，否则 Alembic 会尝试再次创建 `users` 表，容易报错。

你现在第一步应该做的是：

给当前数据库打一个“基线标记”。

这个动作叫：`stamp head`

它的意思是：

“告诉 Alembic，当前这个数据库已经相当于做过初始迁移了。”

## 3. 第一次使用时，你应该怎么做

### 第一步：进入后端目录

打开 PowerShell，执行：

```powershell
cd D:\res\Projects\YCrispyBiscuit-Pancake\Pancake\Server\FastAPI
```

### 第二步：给开发环境设置环境文件

执行：

```powershell
$env:ENV_FILE=".env.development"
```

这一步的作用是告诉项目：

启动配置、数据库地址、JWT 配置，都从 `.env.development` 读取。

### 第三步：给当前数据库打基线标记

执行：

```powershell
.venv\Scripts\alembic.exe stamp head
```

这一步**不会创建表，也不会修改表结构**。

它只会做一件事：

在数据库里记录当前版本号。

### 第四步：检查是否成功

执行：

```powershell
.venv\Scripts\alembic.exe current -v
```

如果成功，你应该能看到当前版本是：

```text
20260407_0001
```

如果看到了这个版本号，就说明：

Alembic 已经和你当前数据库对齐了。

## 4. 以后如果你改了数据库模型，应该怎么做

以后每次你修改了 SQLAlchemy 实体，比如：

- 给 `users` 表加字段
- 改字段长度
- 增加索引
- 调整唯一约束

都按下面顺序走。

### 步骤 1：先改实体代码

比如你改的是：

- `app/entities/UserEntity.py`

### 步骤 2：生成迁移文件

执行：

```powershell
.venv\Scripts\alembic.exe revision --autogenerate -m "描述这次改动"
```

例如：

```powershell
.venv\Scripts\alembic.exe revision --autogenerate -m "add avatar to users"
```

执行完以后，Alembic 会在这个目录生成一个新文件：

- `alembic/versions/`

### 步骤 3：检查新生成的迁移文件

一定要打开新文件看看内容对不对。

重点检查：

1. 是不是只生成了你想改的内容。
2. 有没有误删表、误删索引、误改字段。
3. 升级 `upgrade()` 和回退 `downgrade()` 是否合理。

不要养成“生成完直接执行”的习惯。

### 步骤 4：执行迁移

开发环境执行：

```powershell
$env:ENV_FILE=".env.development"
.venv\Scripts\alembic.exe upgrade head
```

这一步才会真正修改数据库结构。

## 5. `stamp` 和 `upgrade` 的区别

这两个命令最容易搞混。

### `stamp head`

作用：

只登记版本，不改数据库结构。

适用场景：

- 数据库里的表已经存在
- 你只是想让 Alembic 知道当前库已经处于某个版本

### `upgrade head`

作用：

真正执行迁移，修改数据库结构。

适用场景：

- 你已经生成了新的迁移文件
- 你想把数据库升级到最新结构

### 你当前应该用哪个

你当前数据库已经有 `users` 表，所以第一次应该用：

```powershell
.venv\Scripts\alembic.exe stamp head
```

不是：

```powershell
.venv\Scripts\alembic.exe upgrade head
```

## 6. 把这些命令翻译成“像 Git 里的什么操作”

如果你对 Git 更熟，那可以这样理解 Alembic：

- Git 管代码版本
- Alembic 管数据库结构版本

它们不是完全一样，但用来帮助记忆很合适。

### `revision --autogenerate`

可以理解成：

“生成一条新的数据库变更草稿，像是准备一次新的提交内容。”

它像 Git 里的：

- 你改完代码以后，准备形成一次新的提交
- 但这时还只是生成迁移文件，不代表数据库已经改了

一句话记忆：

`revision` 像“生成一份待提交的变更记录”。

### `upgrade head`

可以理解成：

“把数据库真正升级到最新版本。”

它像 Git 里的：

- 把当前工作区真正切到最新提交状态
- 或者把一串提交真正应用到当前环境

一句话记忆：

`upgrade head` 像“把所有数据库版本提交真正应用掉”。

### `downgrade -1` 或 `downgrade <版本号>`

可以理解成：

“把数据库往回退一个版本，或者退回指定版本。”

它像 Git 里的：

- 回退到上一个提交
- 或者回退到某个历史提交

一句话记忆：

`downgrade` 像“数据库版本回退”。

### `current`

可以理解成：

“查看数据库当前停在哪个版本。”

它像 Git 里的：

- 查看当前 HEAD 指向哪里

一句话记忆：

`current` 像“看数据库现在签出到了哪个版本”。

### `heads`

可以理解成：

“查看迁移链路里最新的头版本是什么。”

它像 Git 里的：

- 看当前分支最新提交在哪里

一句话记忆：

`heads` 像“看迁移历史的最新版本号”。

### `stamp head`

这个最容易误解，所以单独强调。

它可以理解成：

“不执行任何真实改动，只是强行把当前数据库标记成某个版本。”

它像 Git 里的：

- 不是执行提交内容
- 而是直接改一个标记，告诉系统‘现在就当它已经到这个版本了’

所以它更像：

- 手动把状态对齐
- 手动补登记
- 手动告诉系统当前基线在哪

一句话记忆：

`stamp` 像“只改版本标签，不执行实际变更”。

### 最简单对照表

| Alembic 命令 | 你可以怎么理解 |
| --- | --- |
| `revision --autogenerate` | 生成一条新的数据库变更记录 |
| `upgrade head` | 把数据库升级到最新版本 |
| `downgrade -1` | 把数据库回退一个版本 |
| `current` | 查看数据库当前版本 |
| `heads` | 查看最新迁移版本 |
| `stamp head` | 只登记版本，不执行真实改动 |

## 7. 这个项目里已经准备好的 npm 命令

如果你不想手写 Alembic 命令，也可以直接用 `package.json` 里准备好的脚本。

### 开发库打基线

```powershell
npm run db:stamp:head:dev
```

### 开发库执行迁移

```powershell
npm run db:migrate:dev
```

### 生产库执行迁移

```powershell
npm run db:migrate:prod
```

### 自动生成迁移文件

```powershell
npm run db:revision
```

## 8. 你现在最应该执行的命令

按你当前项目状态，最应该执行的是下面两条：

```powershell
cd D:\res\Projects\YCrispyBiscuit-Pancake\Pancake\Server\FastAPI
npm run db:stamp:head:dev
```

执行完以后，再执行：

```powershell
$env:ENV_FILE=".env.development"
.venv\Scripts\alembic.exe current -v
```

## 9. 如果报错，优先看哪里

### 情况 1：提示表已存在

原因：

你在已有表的数据库上直接跑了 `upgrade head`。

处理：

先不要升级，改用：

```powershell
.venv\Scripts\alembic.exe stamp head
```

### 情况 2：提示找不到 alembic.exe

原因：

虚拟环境里还没安装 Alembic。

处理：

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 情况 3：提示数据库连接失败

原因通常是：

1. MySQL 没启动
2. `.env.development` 里的数据库地址不对
3. 用户名或密码不对

优先检查：

- `.env.development`
- 本机 MySQL 服务状态

## 10. 一句话记忆版

你只要记住下面这套流程就够了。

### 第一次接入现有数据库

```powershell
$env:ENV_FILE=".env.development"
.venv\Scripts\alembic.exe stamp head
```

### 以后改表结构

```powershell
.venv\Scripts\alembic.exe revision --autogenerate -m "这次改了什么"
```

```powershell
$env:ENV_FILE=".env.development"
.venv\Scripts\alembic.exe upgrade head
```

## 11. 你可以从哪里继续

如果你现在只想先把当前库登记到 Alembic，直接执行：

```powershell
npm run db:stamp:head:dev
```

如果你想继续把这套后端收拾得更规范，下一步建议做这两件事：

1. 生产环境数据库连接失败时直接阻止启动。
2. 把 JWT 密钥改成真正的环境注入，而不是弱默认值。