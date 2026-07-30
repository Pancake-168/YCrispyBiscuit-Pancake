# FastAPI 后端架构与统一编写风格

> 编写日期：2026-07-14
> 说明：本文基于当前 `Pancake\Server\FastAPI` 实际代码整理。
> 说明：按你的要求，明确排除 `app/controllers/PictureSwitchController.py`，不把它纳入架构判断，也不建议删除它。

---

## 一、当前后端架构总览

当前后端并不是单纯的“FastAPI + Controller + Service”。它实际由以下层级组成：

1. 启动与应用装配层
   - `app/main.py`
   - `app/api/router.py`
   - `app/core/lifespan.py`
   - `app/socketio.py`

2. 基础设施层
   - `app/core/config.py`
   - `app/core/database.py`
   - `app/core/logging.py`
   - `app/db.py`
   - `app/middlewares/request_id.py`
   - `app/exceptions/errors.py`
   - `app/exceptions/handlers.py`

3. HTTP 接口层
   - `app/controllers/*.py`

4. 业务服务层
   - `app/services/*.py`

5. 数据访问层
   - `app/mappers/*.py`

6. 数据模型层
   - `app/entities/*.py`
   - `app/schemas/*.py`

7. 共享工具层
   - `app/utils/*.py`

整体调用链大致是：

`main -> router -> controller -> service -> mapper/entity`

同时还并行存在两条横切链路：

1. `controller/service/utils -> AppError -> exceptions/handlers`
2. `main -> socketio` 的事件通信链路

---

## 二、当前代码风格差异总判断

当前项目的主要问题不是“某一个文件写得差”，而是“不同阶段、不同作者风格并存”，导致层与层之间没有完全统一的约束。

我基于实际代码，判断当前风格状态如下：

1. 架构方向基本清楚：已经有 controller、service、mapper、entity、schema、utils、core 的分层。
2. 主链路统一度已经明显提升：活跃 controller 已统一为 `Depends(...)` 注入 service。
3. 活跃代码命名已基本收敛到 `snake_case`，但文件命名和个别历史文件仍有遗留差异。
4. 项目异常边界已基本收口到 `AppError` 体系，业务主路径里已不再混用 `KeyError` / `RuntimeError`。
5. Schema 层的明显可变默认值问题已清理，但注释密度和 `ConfigDict` 使用还未完全统一。
6. 原先最厚的两个 service 已进入“编排层 + 子模块”结构，但外层编排 service 仍然存在进一步抽象空间。
7. 鉴权实现已经从 `utils` 物理迁出，当前统一落在 `services/AuthService.py`。

结论：当前项目已经从“风格明显发散”进入“主链路已统一、边角仍待继续收口”的状态。

---

## 三、逐层风格差异

## 3.1 启动与应用装配层

代表文件：

1. `app/main.py`
2. `app/api/router.py`
3. `app/core/lifespan.py`
4. `app/socketio.py`

现状特点：

1. `main.py`、`lifespan.py`、`logging.py` 的工程化程度较高，注释完整，职责清晰。
2. `router.py` 极薄，只做路由汇总，这个方向是对的。
3. `socketio.py` 自成一套事件层，注释很重，风格更接近教学式文档代码。
4. HTTP 路由和 Socket.IO 事件都挂在同一个进程里，这是当前架构的重要事实。

风格差异点：

1. `main.py` 偏“框架装配风格”。
2. `socketio.py` 偏“说明文档式风格”。
3. `router.py` 偏“极简汇总风格”。

这三者都不算错，但视觉风格明显不是一套写法。

## 3.2 Controller 层

纳入判断的文件：

1. `HealthController.py`
2. `UserController.py`
3. `WeatherController.py`
4. `BilibiliController.py`
5. `PictureController.py`
6. `PCmethodsController.py`

排除：

1. `PictureSwitchController.py`

当前状态：

1. Service 获取方式已统一为 `Depends(provider)`。
2. Controller 方法命名已统一为 `snake_case`。
3. 仍然存在的差异主要是异常处理边界和响应包装风格。

其中异常处理差异体现在：

1. `PictureController.py` 仍显式抛 `BadRequestError`、`NotFoundError`。
2. 多数其他 controller 仍以“调用 service + 返回 response”为主，不在控制器层显式抛项目异常。

响应包装差异体现在：

1. 有的统一 `Response(**result)`。
2. 有的直接构造 `AuthResponse(...)`。
3. 有的直接返回普通 dict。

## 3.3 Service 层

代表文件：

1. `HealthService.py`
2. `UserService.py`
3. `WeatherService.py`
4. `PCmethodsService.py`
5. `PictureService.py`
6. `BilibiliService.py`
7. `AuthService.py`
8. `PictureImageIO.py`
9. `PictureSvgService.py`
10. `PictureTransformService.py`
11. `PictureTaskStore.py`
12. `BilibiliWbi.py`
13. `BilibiliSession.py`
14. `BilibiliPageService.py`
15. `BilibiliLoginService.py`

当前差异：

1. 文件命名现在已统一为 `XxxService.py`。
2. 活跃公开方法命名已基本统一为 `snake_case`。
3. 当前最大差异转为“编排 service 与子模块之间的职责边界细化程度不同”。
   - `HealthService` 很薄，只是 mapper 转发。
   - `UserService` 是标准业务 service。
   - `PictureService` 已收缩为图片转换编排层，底层能力已拆到 `PictureImageIO.py`、`PictureSvgService.py`、`PictureTransformService.py`、`PictureTaskStore.py`。
   - `BilibiliService` 已收缩为聚合层，登录、页面抓取、会话/WBI 已拆到独立模块。

4. 异常风格较整改前统一。
   - `UserService`、`WeatherService`、`PCmethodsService`、`BilibiliService`、`PictureService` 已主要使用项目自定义异常。
   - 目前保留的通用 `RuntimeError` 主要在基础设施层，而不在业务主路径中。

判断：

1. `UserService` 最接近可复制的标准 service 风格。
2. `PictureService` 和 `BilibiliService` 的第一轮深拆已经完成，后续重点不再是“必须拆”，而是“是否继续抽象编排层”。

## 3.4 Mapper 层

代表文件：

1. `UserMapper.py`
2. `HealthMapper.py`

当前差异：

1. `UserMapper` 是典型 ORM mapper，负责 SQLAlchemy 查询和异常翻译。
2. `HealthMapper` 只是返回常量 dict，本质上不像真正的数据访问层。

说明：

1. 这意味着项目里“mapper”一词目前并不稳定。
2. 有些 mapper 是数据库仓储层，有些 mapper 只是一个形式上的中间层。

## 3.5 Entity 层

当前只有 `UserEntity.py` 真正承担 ORM 实体职责。

现状：

1. `UserEntity` 写法是标准 SQLAlchemy 声明式模型。
2. 但整个项目只有这一处实体，说明 entity 层还没有成为普遍模式。

判断：

1. 当前 entity 层不是“完整层”，更像“用户模块专属层”。

## 3.6 Schema 层

代表文件：

1. `UserSchema.py`
2. `PictureSchema.py`
3. `HealthSchema.py`
4. `WeatherSchema.py`
5. `PCmethodsSchema.py`
6. `BilibiliSchema.py`

当前差异：

1. 命名总体是统一的，都是 `XxxRequest` / `XxxResponse` / `BaseModel` 方向。
2. 但注释风格差异很大。
   - `PictureSchema.py` 注释非常密。
   - `BilibiliSchema.py` 极简。
   - `UserSchema.py` 混有大量 `###` 风格注释。

3. 可变默认值问题已整改完成。
   - `PCmethodsWorkflowResponse.folder` 已改为 `Field(default_factory=list)`。
   - `BilibiliStoredValuesResponse.cookies` 已改为 `Field(default_factory=dict)`。

4. Pydantic 配置使用不统一。
   - `UserResponse`、`HealthResponse` 用了 `ConfigDict(from_attributes=True)`。
   - 其他 response model 多数没统一配置。

## 3.7 Utils 层

代表文件：

1. `PictureUtils.py`

当前差异：

1. `PictureUtils.py` 仍是典型纯函数工具模块。
2. 鉴权相关实现已迁出 `utils`，因此 `utils` 目录边界较整改前更清晰。

结论：

1. 当前 `utils` 目录基本只保留纯工具模块。
2. 鉴权实现已完成迁移，`services/AuthService.py` 已成为唯一服务入口。

## 3.8 Core / Exceptions / Middleware 层

现状：

1. `core/config.py`、`core/database.py`、`core/logging.py`、`core/lifespan.py` 的风格相对统一，偏工程化。
2. `exceptions/errors.py` 很清晰，是一个简洁的异常枚举层。
3. `exceptions/handlers.py` 很完整，但处理范围比较宽，已经把项目异常和通用 Python 异常都兜进来了。
4. `middlewares/request_id.py` 非常薄，职责单一，风格健康。

---

## 四、统一 FastAPI 编写风格

以下是建议在本项目内统一执行的风格，不是泛泛而谈，而是针对当前代码状态收敛出来的版本。

## 4.1 目录职责

1. `controllers/`
   - 只负责 HTTP 参数接收、依赖注入、调用 service、返回 response model。

2. `services/`
   - 负责业务编排、外部 API 调用、文件系统操作、跨 mapper 聚合。

3. `mappers/`
   - 只负责数据库读写和 ORM 查询。

4. `entities/`
   - 只放 SQLAlchemy 实体。

5. `schemas/`
   - 只放请求与响应模型，不混业务逻辑。

6. `utils/`
   - 只放纯函数、无状态工具。
   - 当前项目已经将鉴权实现迁出 `utils`，后续继续保持这个边界。

7. `core/`
   - 只放配置、数据库、日志、生命周期等基础设施。

## 4.2 命名规则

1. Python 文件名统一使用 `PascalCase` 对应模块语义，或统一改为小写下划线，但项目内必须只选一种。
2. 函数名、方法名、局部变量名统一 `snake_case`。
3. 类名统一 `PascalCase`。
4. 禁止新增 `getMMDPaths`、`openFolder`、`registerUser`、`getHealth` 这类混合风格命名。

## 4.3 Controller 规则

1. controller 不直接写业务细节。
2. controller 统一只做三件事：接收参数、调用 service、组装 response。
3. controller 允许做“轻参数防御校验”，例如空列表、路径不存在、分页范围非法。
4. controller 中 service 获取方式统一成一种。
   - 对当前项目，推荐统一为 `Depends(...)` 注入。

## 4.4 Service 规则

1. service 是主要业务边界。
2. service 内允许抛项目自定义异常，不建议混用 `RuntimeError`、`KeyError`。
3. 超过 300 行且同时承担状态、协议、缓存、编解码、文件操作的 service，应拆分子模块。
4. 外部 API 协议辅助函数应优先下沉到独立 helper / gateway，而不是全部堆在同一个 service 文件里。

## 4.5 Mapper 规则

1. mapper 只负责数据库查询与持久化。
2. mapper 不负责 response schema 组装。
3. mapper 统一把 ORM/SQL 异常翻译为项目异常。

## 4.6 Schema 规则

1. request model 用 `XxxRequest`。
2. response model 用 `XxxResponse`。
3. 禁止使用可变默认值，如 `[]`、`{}`。
4. 对 ORM 输出的 response model，统一显式写 `ConfigDict(from_attributes=True)`。

## 4.7 异常规则

1. 业务可预期错误统一使用 `app.exceptions.errors` 里的异常。
2. `KeyError`、`RuntimeError` 只保留给真正的内部编程错误，不作为业务错误主路径。
3. controller 和 service 不直接抛 `HTTPException`，统一交给 `AppError` + handler。

## 4.8 注释规则

1. 保留中文注释，但密度要适中。
2. controller、service、core 层可以有解释性注释。
3. schema、entity、mapper 层尽量短注释，不要写成长篇教程式说明。

---

## 五、建议的统一方向

如果只给当前项目定一个统一方向，我建议采用下面这套：

1. `controller -> service -> mapper -> entity/schema` 作为唯一主链路。
2. 统一 `snake_case` 方法命名。
3. 统一项目异常 `AppError` 体系，不混用 `KeyError` / `RuntimeError` 做业务分支。
4. 统一 controller 的 service 注入方式。
5. 统一 schema 的默认值和 Pydantic 配置写法。
6. 统一 utils 目录边界，把“不是纯工具”的模块逐步迁出。

---

## 六、按优先级的整改顺序

1. 第一优先级：统一命名风格。
   - 这是最容易形成全局一致性的部分。

2. 第二优先级：统一异常边界。
   - 先规定哪些错误必须用 `AppError`。

3. 第三优先级：统一 controller 的 service 获取方式。

4. 第四优先级：清理 schema 中的可变默认值。

5. 第五优先级：拆分超厚 service。
   - 重点对象是 `PictureService.py` 和 `BilibiliService.py`。

> 更新：上述第五优先级的第一轮拆分已经完成。当前更适合做运行验证和文档同步，而不是继续无条件机械拆分。

---

## 七、最终判断

当前后端不是“没有架构”，而是“已经有架构骨架，且主链路风格已经基本收口，但仍有少量文档、注释和进一步抽象空间”。

最成熟的部分：

1. `core/`
2. `exceptions/`
3. 用户模块的 `service + mapper + entity + schema` 主链路

最不统一的部分：

1. controller 层
2. service 层命名与职责厚度
3. utils 层边界

所以后续如果要持续维护这个 FastAPI 项目，最正确的做法不是重写，而是以本文档为基线，按层逐步收敛到统一风格。