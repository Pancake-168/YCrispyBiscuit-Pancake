# Nocobase 自定义 Embed 插件开发

记录了开发 `@my-project/plugin-my-embed` 插件的完整流程。
该插件旨在实现类似官方商业版 `Embed` 插件的功能，即通过 URL 参数隐藏 Nocobase 的菜单和导航栏，并支持通过 URL 传递 Token 进行免登录访问，方便在 Iframe 中集成。

## 1. 环境准备与插件创建

### 1.1 进入项目根目录
确保位于 Nocobase 项目的根目录下。

### 1.2 创建插件脚手架
使用 Nocobase 提供的 CLI 工具创建插件。

```bash
yarn pm create @YanJing-Embed/plugin-YanJing-embed
```


@YanJing-Embed/plugin-YanJing-embed
@YanJing-AutoTable/plugin-YanJing-autotable
@YanJing-Auth/plugin-YanJing-auth


执行后，系统会在 `packages/plugins/@YanJing-Embed/plugin-YanJing-embed` 目录下生成插件的基本结构。

---

## 2. 服务端开发 (Server)

服务端的主要任务是拦截请求，将 URL 参数中的 `token` 转换为标准的 `Authorization` 请求头，以便 Nocobase 的核心 Auth 模块能够识别用户身份。

### 2.1 编辑服务端入口文件
打开文件：`packages/plugins/@YanJing-Embed/plugin-YanJing-embed/src/server/plugin.ts`

### 2.2 编写代码
将文件内容修改为以下代码：

```typescript
import { Plugin } from '@nocobase/server';

export class PluginMyEmbedServer extends Plugin {
  async load() {
    // 注册一个全局中间件
    // { before: 'auth' } 确保在认证中间件之前执行，这样才能把 token 塞进去
    this.app.use(async (ctx, next) => {
      // 1. 检查 URL 参数里有没有 token
      const { token } = ctx.query;
      
      // 2. 如果有 token，且请求头里没有 Authorization
      // 防止覆盖客户端本来就传了 Header 的情况
      if (token && !ctx.get('Authorization')) {
        // 3. 伪造 Authorization 头，骗过后续的 auth 插件
        // Nocobase 默认识别 Bearer Token
        ctx.request.header['authorization'] = `Bearer ${token}`;
      }
      
      await next();
    }, { before: 'auth' }); 
  }
}

export default PluginMyEmbedServer;
```

---

## 3. 客户端开发 (Client)

客户端的主要任务是检测 URL 中的 `embed=true` 参数，如果存在，则注入 CSS 样式隐藏顶部菜单、侧边栏等无关元素，只保留内容区域。

### 3.1 编辑客户端入口文件
打开文件：`packages/plugins/@my-project/plugin-my-embed/src/client/index.tsx`

### 3.2 编写代码
将文件内容修改为以下代码：

```tsx
import { Plugin } from '@nocobase/client';

export class PluginMyEmbedClient extends Plugin {
  async load() {
    // 1. 检查 URL 参数里有没有 embed=true
    // 使用原生 URLSearchParams 解析查询字符串
    const urlParams = new URLSearchParams(window.location.search);
    const isEmbed = urlParams.get('embed') === 'true';

    if (isEmbed) {
      this.injectEmbedStyles();
    }
  }

  injectEmbedStyles() {
    // 2. 暴力注入 CSS，隐藏所有不该显示的东西
    // 使用 !important 覆盖原有样式
    const style = document.createElement('style');
    style.innerHTML = `
      /* 隐藏顶部导航栏 */
      header.ant-layout-header, 
      .nb-layout-header {
        display: none !important;
      }
      
      /* 隐藏左侧侧边栏 */
      aside.ant-layout-sider,
      .nb-layout-sider {
        display: none !important;
      }
      
      /* 修正内容区域的高度和边距，使其占满 Iframe */
      .ant-layout-content {
        height: 100vh !important;
        overflow: auto !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      /* 隐藏可能出现的面包屑导航 */
      .ant-breadcrumb {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

export default PluginMyEmbedClient;
```

---

## 4. 构建与启用

代码编写完成后，需要编译插件并将其注册到 Nocobase 系统中。

### 4.1 构建插件
在项目根目录下运行：

```bash
yarn build @my-project/plugin-my-embed
```

*注意：如果遇到 TypeScript 类型错误（如 `Cannot find module`），只要最后显示 `TypeScript: emit succeeded`，通常不影响运行，因为 JS 文件已经生成。*

### 4.2 启用插件
构建成功后，启用插件：

```bash
yarn pm enable @my-project/plugin-my-embed
```

### 4.3 重启服务
如果 Nocobase 服务正在运行，请重启它以加载新插件。

```bash
yarn dev
```

---

## 5. 验证与使用

可以通过构造特殊的 URL 来在 Iframe 中嵌入 Nocobase 页面。

Nocobase 地址是 `http://localhost:13000`，想嵌入 `admin/home` 页面。

URL 格式如下：
`http://localhost:13000/admin/home?token=YOUR_TOKEN&embed=true`



## 6. 打包发布

如果需要将插件部署到生产环境或其他服务器。

### 6.1 打包为 TGZ (NPM 标准格式)
进入插件目录并打包：

```bash
cd packages/plugins/@my-project/plugin-my-embed
yarn pack
```
会生成一个 `my-project-plugin-my-embed-v1.9.30.tgz` 文件。

### 6.2 打包为 ZIP (可选)
如果更习惯用 ZIP：

```powershell
Compress-Archive -Path dist, package.json, README.md, client.js, server.js, client.d.ts, server.d.ts -DestinationPath my-project-plugin-my-embed-v1.9.30.zip -Force
```

### 6.3 在生产环境安装
将压缩包上传到服务器，运行：

```bash
# 安装
yarn add ./my-project-plugin-my-embed-v1.9.30.tgz

# 启用
yarn pm enable @my-project/plugin-my-embed

# 重启 Nocobase
```

  "displayName": "YanJing Embed",
    "description": "Embed Nocobase pages in iframe.",

    
---

## 7. 进阶配置与常见问题

### 7.1 设置为内置插件 (自动启用)
为了避免每次创建新应用或子应用时都需要手动启用插件，可以将插件添加到 Nocobase 的预设配置中，使其成为系统内置插件。

1.  **修改 Preset 依赖**
    打开 `packages/presets/nocobase/package.json`，在 `dependencies` 中添加插件：
    ```json
    "dependencies": {
      "@YanJing-Embed/plugin-YanJing-embed": "1.9.30",
      // ... 其他依赖
    }
    ```

2.  **添加到 BuiltIn 列表**
    在同一个文件的 `builtIn` 数组中添加插件名称：
    ```json
    "builtIn": [
      // ... 其他内置插件
      "@YanJing-Embed/plugin-YanJing-embed"
    ]
    ```

### 7.2 Windows 环境网络连接问题
在 Windows 环境下，如果遇到前端页面打不开或连接被拒绝（Connection Refused），通常是因为 `localhost` 解析到了 IPv6 (`::1`) 而服务监听在 IPv4 (`127.0.0.1`)。

**解决方法**：
修改项目根目录下的 `.env` 文件，强制指定 IP 地址：

```ini
APP_HOST=127.0.0.1
HOST=127.0.0.1
```