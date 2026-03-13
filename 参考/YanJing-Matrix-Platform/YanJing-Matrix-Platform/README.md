# 研境AI 项目概述

研境AI的前端


## 关于.gitignore

本项目的.env文件不被忽略，跟随仓库上传，内部仓库不用搞那么麻烦


## 平台
顾名思义，你以为只有web端嘛？非也！我还加了electron！

YanJing-Matrix-Platform\electron这个路径下有一些基础的electron的api，方便调用

为了实现本地存储，这了做了专门的全局存储管理器YanJing-Matrix-Platform\src\utils\SystemStorage.ts，可依据环境选择存入web还是pc本地

## Matrix 说明

- 房间成员加载与 `getMembers()` / `loadMembersIfNeeded()` 的判断说明见 [docs/MATRIX_MEMBER_LOADING.md](docs/MATRIX_MEMBER_LOADING.md)


## 脚本
package.json里的脚本有“chcp 65001>nul”，这是调用终端时防止出现中文乱码而加上的

electron主程序脚本从.env里面读取端口并启动，一键启动且端口写死5175！防止你同时开多个前端项目导致系统从5173自增结果electron读错端口！

当然5175可自行更改！





## Git 文件名大小写（Windows）

在 Windows 上常见问题：仅修改文件名大小写（如 `wechatSSO.ts` → `WeChatSSO.ts`）时，可能被系统/Git 当作同一文件，导致推送到远端后文件名大小写没有变化。

### 查看/修改仓库的大小写判定

- 查看当前仓库配置：
	- `git config --show-origin --get core.ignorecase`
- 将当前仓库改为区分大小写判定（推荐仅对该仓库生效）：
	- `git config --local core.ignorecase false`

说明：该设置写入 `.git/config`，只影响当前仓库。

### 仅改大小写的正确改名方式（推荐）

即使设置了 `core.ignorecase=false`，在 Windows 默认大小写不敏感的文件系统上，仍建议使用“两步改名”确保 Git 记录为 rename：

- `git mv path/to/foo.ts path/to/foo_tmp.ts`
- `git mv path/to/foo_tmp.ts path/to/Foo.ts`



## 打包配置
内测环境下的electron打包
 - 请将两个.env文件反转
 - 请将build配置的目标目录注释掉
 - 端口调整为5173

生产环境下的electron打包
 - 请将build配置的目标目录注释掉