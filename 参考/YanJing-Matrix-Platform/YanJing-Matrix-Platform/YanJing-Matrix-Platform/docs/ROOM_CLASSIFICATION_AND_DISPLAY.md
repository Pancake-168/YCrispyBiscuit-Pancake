# 房间类型划分与房间列表外显逻辑说明

## 1. 文档范围

本文档说明当前项目中与以下两件事相关的完整实现链路：

1. 房间类型划分：把房间归为 `user` 或 `bot`。
2. 房间列表外显：决定房间列表、房间头部等位置显示什么名称、什么头像、什么时候回退成首字。

本文档对应的核心实现文件包括：

- `src/stores/RoomClassification.ts`
- `src/stores/RoomDisplay.ts`
- `src/utils/roomPeerInfo.ts`
- `src/utils/roomGroupDisplay.ts`
- `src/services/Matrix/refreshRoomState.ts`
- `src/services/ProjectStart.ts`
- `src/components/RoomList/index.vue`
- `src/components/Room/RoomHeader/index.vue`
- `src/stores/System.ts`
- `src/services/Matrix/room.ts`
- `src/services/Project/IM/Room.ts`

## 2. 总体结论

当前项目把“房间类型”和“房间外显”拆成两套独立逻辑：

- `RoomClassification` 只负责回答：这个房间属于 `user` 还是 `bot`。
- `RoomDisplay` 只负责回答：这个房间在 UI 上应该显示什么名称、什么头像。

两者共享一部分“房间对端解析能力”，但职责不同。

一个房间可以：

- 在类型上被归为 `user`。
- 在外显上被视为“群聊显示”。

这两件事并不冲突。当前的群聊房间仍然归在 `user` 列表中，只是外显规则不同。

## 3. 房间源集合从哪里来

所有后续分类和显示逻辑，都是基于 `MatrixClientRoom.getNormalRooms()` 的结果进行的。

对应文件：`src/services/Matrix/room.ts`

### 3.1 `getNormalRooms()` 的过滤规则

只有满足以下条件的房间才会进入业务房间池：

1. 当前用户仍在房间内，membership 为 `join` 或 `invite`。
2. 不是 space 房间。
3. 不是 Matrix `m.direct` 标记的一对一私聊房间。
4. 房间内不能存在 `join` / `invite` 之外的污染成员状态；一旦出现 `leave`、`ban` 等成员，整个房间会被视为脏数据并被排除。

### 3.2 成员读取函数的语义差异

`src/services/Matrix/room.ts` 中有三套成员函数：

- `getAllRoomMembers(room)`：返回原始成员列表，包含所有 membership 状态。主要用于生成房间签名、检测成员变化。
- `getRoomMembers(room)`：只接受 `join` / `invite` 成员；如果存在脏成员则直接返回空数组。
- `getRoomMembersById(roomId)`：与 `getRoomMembers(room)` 语义一致，只是入参改为 `roomId`。

这三者的差异非常关键：

- 分类签名使用的是全量成员快照。
- 业务逻辑和外显逻辑大都使用“有效成员集”。

## 4. 房间类型划分逻辑

对应文件：`src/stores/RoomClassification.ts`

### 4.1 类型枚举

当前只有两种业务类型：

- `user`
- `bot`

没有单独的 `group` 类型。群聊依然属于 `user`。

### 4.2 分类结果结构

每个房间会生成一个 `RoomClassificationProfile`：

- `roomId`
- `type`
- `reason`
- `signature`
- `updatedAt`

其中 `reason` 用于记录本次分类命中的依据，当前可能值为：

- `invite`
- `dm-uu`
- `dm-ub`
- `member-count`
- `members-api-user`
- `members-api-bot`
- `matrix-user`
- `matrix-bot`
- `fallback-user`

### 4.3 分类优先级

`classifyRoom()` 的执行顺序如下：

1. 如果房间当前是邀请房间，直接归类为 `user`，原因 `invite`。
2. 查询后端 `GetDMRoom()` 返回的 DM 类型表：
   - `uu` -> `user`
   - `ub` -> `bot`
3. 如果有效成员数 `>= 3`，直接归类为 `user`，原因 `member-count`。
4. 如果有效成员数 `=== 2`：
   - 先走 `getRoomMembersBe(roomId)`，看对端成员中是否有 `user` 或是否全为 `bot`。
   - 如果后端成员接口不足以判定，再走 Matrix 成员解析 `resolveRoomPeerInfos(roomId)`。
5. 如果以上都无法得出明确结论，最终回退为 `user`，原因 `fallback-user`。

### 4.4 为什么 `>= 3` 直接归为 `user`

这是当前项目的核心约束：

- 只要不是明确的 `bot` 单聊，就不要把多人房间送去 Mission 侧。
- 所有多人房间，包括 4 人标准房、多人群聊，当前都留在 Message 侧的 `user` 列表中。

所以：

- “是不是群聊显示”是显示层问题。
- “是不是 `user` 类型房间”是分类层问题。

### 4.5 分类缓存与刷新机制

分类缓存通过 `SystemStorageManager` 按当前用户名持久化。

缓存刷新依据：

- 当前用户变化。
- 手动强制刷新。
- 房间签名变化。
- 指定 `changedRoomId` 被标记为需要刷新。

房间签名由以下内容构成：

- 自己在房间中的 membership。
- 全量成员快照（`userId:membership` 排序后拼接）。
- 后端 DM 类型信息。

### 4.6 分类结果如何进入系统态

分类结果最终通过 `buildTaggedRoomEntries()` 生成：

```ts
Array<{ type: 'bot' | 'user'; room: MatrixRoom | Room }>
```

然后写入 `SystemStore.SystemRooms`。

对应文件：`src/stores/System.ts`

## 5. 房间列表的归属与切页逻辑

### 5.1 `SystemRooms` 是单一真源

`src/stores/System.ts` 中：

- `SystemRooms` 保存所有业务房间及其类型。
- `currentFunction === 'Message'` 时只看 `type === 'user'`。
- `currentFunction === 'Mission'` 时只看 `type === 'bot'`。

### 5.2 `refreshRoomState()` 的职责

对应文件：`src/services/Matrix/refreshRoomState.ts`

此函数负责统一刷新消息域状态：

1. 获取正常业务房间。
2. 重新分类。
3. 更新 `SystemRooms`。
4. 重建 `RoomMap`。
5. 根据 `preferredRoomId` 推导应该落到 Message 还是 Mission。
6. 预取外显信息。
7. 修正当前选中的房间。
8. 如有需要，重新拉取当前房间消息。

### 5.3 `startProject()` 的启动与运行时刷新

对应文件：`src/services/ProjectStart.ts`

启动与运行时刷新路径：

1. 启动后先调用一次 `refreshRooms()`。
2. 收到 `SYNC_COMPLETED` 后再次刷新。
3. 收到 `ROOM_INVITED` / `ROOM_JOINED` / `ROOM_LEFT` / `ROOM_UPDATED` 时，按 membership 时序做延迟校验后刷新。
4. 新增房间会预取外显信息。
5. 指定房间变更时会强制刷新该房间的外显信息。

## 6. 房间外显逻辑

对应文件：`src/stores/RoomDisplay.ts`

### 6.1 外显结果结构

每个房间会生成一个 `RoomDisplayProfile`：

- `roomId`
- `displayName`
- `avatarUrl`
- `updatedAt`

### 6.2 外显读取接口

外部消费层主要使用以下三个方法：

- `getRoomDisplayName(roomId, fallbacks)`
- `getRoomDisplayAvatarUrl(roomId)`
- `getRoomDisplayInitial(roomId, fallbacks)`

其中 `getRoomDisplayInitial()` 的逻辑非常简单：

- 先取 `displayName`
- 没有就取 fallback
- 再取首字符作为文字头像

### 6.3 普通外显房间的名称与头像来源

对于非群聊显示房间，`refreshRoomDisplayProfile(roomId)` 的逻辑是：

1. 调用 `GetRoomOtherUser(roomId)` 获取对端用户信息。
2. 走 `resolveMemberFallbackInfo(roomId)` 做兜底。
3. 必要时通过用户名补打 `GetIMUserInfo(username)`。
4. 组装最终的：
   - `displayName`
   - `matrixUserId`
   - `avatarUrl`

名称优先级大致为：

1. `IDMap.nickname`
2. `roomPeerInfo` 兜底昵称
3. `GetIMUserInfo.nickname`
4. `GetRoomOtherUser.nickname`
5. `username`
6. `GetRoomOtherUser.display_name`

头像优先级大致为：

1. `GetRoomOtherUser.avatar_url`
2. `matrixUserId` 对应的 Matrix 头像

### 6.4 群聊显示房间的规则

对应共享工具：`src/utils/roomGroupDisplay.ts`

当前群聊外显判定规则为：

1. 如果有效成员数 `> 4`，视为群聊显示房间。
2. 如果有效成员数 `=== 4`：
   - 调用 `GetRoomOtherUser(roomId)`。
   - 如果返回了对方用户数据，则说明它仍然是“可识别对端”的 4 人房，不按群聊显示。
   - 如果没有返回对方数据，则说明它应按群聊显示。
3. 其他人数不按群聊显示。

### 6.5 群聊显示房间如何展示

一旦命中群聊显示规则：

1. `displayName` 直接使用 Matrix 房间名。
2. `avatarUrl` 不写入，保持 `undefined`。
3. UI 自动回退到“名称首字符”作为文字头像。

因此群聊外显的最终效果是：

- 名称：Matrix 房间名。
- 头像：Matrix 房间名首字。

注意：这只影响显示，不影响分类。群聊房间仍然属于 `user` 类型。

### 6.6 外显缓存与刷新机制

外显缓存同样按当前用户名写入 `SystemStorageManager`。

刷新触发包括：

- 启动时首次预取。
- 新房间加入后预取。
- 进入指定房间时强制刷新。
- 房间元信息或成员变化后刷新。

## 7. 房间对端解析的共享能力

对应文件：`src/utils/roomPeerInfo.ts`

这个工具不直接决定分类或显示，它只是提供“从 Matrix 房间成员中解析出业务对端信息”的共享能力。

### 7.1 它做了什么

对每个有效成员（排除当前用户）按顺序尝试：

1. 先查 `IDMap`。
2. 如果没有，再从 Matrix ID 提取 localpart。
3. 再调用 `GetIMUserInfo(localpart)`。

最终返回 `ResolvedRoomPeerInfo[]`，包含：

- `matrixUserId`
- `username`
- `nickname`
- `type`
- `source`

### 7.2 谁在用它

- `RoomClassification.classifyByMatrixMembers()` 用它判断对端是 `user` 还是 `bot`。
- `RoomDisplay.resolveMemberFallbackInfo()` 用它在 `GetRoomOtherUser` 不足时做外显兜底。

### 7.3 缓存策略

`roomPeerInfo.ts` 内部自己维护：

- `roomPeerInfoCache`
- `roomPeerInfoInFlight`

当分类缓存被强制刷新时，也会清理对应的 `roomPeerInfo` 缓存，避免旧成员解析污染后续结论。

## 8. UI 消费点

### 8.1 房间列表

对应文件：`src/components/RoomList/index.vue`

房间列表读取流程：

1. 从 `SystemStore.SystemRooms` 中按当前页面类型过滤房间。
2. 对每个房间调用：
   - `getRoomDisplayName()`
   - `getRoomDisplayAvatarUrl()`
   - `getRoomDisplayInitial()`
3. 如果没有 `avatarUrl`，就显示文字头像。

因此列表中的群聊显示，是完全由 `RoomDisplayStore` 决定的。

### 8.2 房间头部

对应文件：`src/components/Room/RoomHeader/index.vue`

房间头部显示名与房间列表使用的是同一套 `getRoomDisplayName()`，所以：

- 群聊列表外显名是什么，头部名称就是什么。
- 这保证了房间列表与 RoomHeader 名称一致。

### 8.3 其他消费点

当前项目中，`RoomDisplayStore` 的结果还会被其他位置复用，例如：

- `EntityList`
- `SystemNotification`
- 房间管理中的群聊按钮显示条件间接复用 `roomGroupDisplay`

## 9. 当前群聊与 4 人房的真实语义

### 9.1 旧逻辑

旧逻辑里并没有真正的“4 人房就是群聊”的判定。

以前只是：

- 分类上：人数 `>= 3` 就归为 `user`。
- 显示上：默认尝试取第一个可解析对端成员作为名称和头像。

因此 4 人房过去看起来像“显示第一个 user”，本质上是显示层没有单独的群聊分支。

### 9.2 当前逻辑

现在 4 人房是否按群聊显示，不再依赖房间名字符串，而依赖：

- 成员数
- `GetRoomOtherUser(roomId)` 是否能识别出明确对端用户

这比房间名包含“群聊”更严格，也更符合后端语义。

## 10. 失败与降级策略

当前实现整体遵循“尽量降级，不阻断主链路”的策略：

- `GetDMRoom()` 失败：分类仍可回退到成员数和成员解析。
- `getRoomMembersBe()` 失败：分类仍可回退到 Matrix 成员解析。
- `GetRoomOtherUser()` 失败：外显仍可回退到 `roomPeerInfo`。
- `GetIMUserInfo()` 失败：仍然可以使用 Matrix 级别信息或最终回退名。

因此房间列表通常不会因为单个接口异常而整体失效，只会表现为：

- 类型判定不够精确。
- 外显名称/头像退化为 fallback。

## 11. 当前规则摘要

### 11.1 类型划分摘要

- `invite` 房间 -> `user`
- `dm-uu` -> `user`
- `dm-ub` -> `bot`
- 有效成员数 `>= 3` -> `user`
- 双人房再看后端成员或 Matrix 成员类型
- 兜底 -> `user`

### 11.2 群聊外显摘要

- 有效成员数 `> 4` -> 群聊显示
- 有效成员数 `=== 4` 且 `GetRoomOtherUser(roomId)` 无法返回对方数据 -> 群聊显示
- 群聊显示时：
  - 名称 = Matrix 房间名
  - 头像 = 房间名首字
  - 类型仍然是 `user`

### 11.3 普通 user 房间外显摘要

- 优先使用 `GetRoomOtherUser(roomId)` 返回的对端用户信息
- 不足时回退到 `roomPeerInfo`
- 再不足时回退到 Matrix 房间名或文字头像

## 12. 后续维护建议

如果后续还要继续演进这一块，建议保持以下边界：

1. 不要在 `RoomClassification` 中引入 `group` 类型，除非 Message/Mission 的路由归属也要改变。
2. 群聊与否如果只影响显示，优先放在 `RoomDisplay` 或共享显示规则工具中处理。
3. 涉及“4 人房是否为群聊”的规则，统一修改 `src/utils/roomGroupDisplay.ts`，不要在 UI 组件中重复写判断。
4. 涉及“对端成员是谁”的规则，统一修改 `src/utils/roomPeerInfo.ts`，不要在分类和显示层各写一遍。
