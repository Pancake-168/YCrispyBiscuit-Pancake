# Matrix 房间成员加载说明

## 结论

当前项目里，房间成员读取默认可以先继续使用 `room.getMembers()`，暂时不必全量改成先调用 `loadMembersIfNeeded()`。

原因如下：

- 当前项目没有主动开启 `lazyLoadMembers`
- 项目里的核心房间刷新逻辑已经在 Matrix 同步完成后再次执行
- 因此大多数业务场景下，`getMembers()` 在当前项目里已经够用

但这个结论不是“任何时刻都绝对成立”。如果是在同步尚未完成前读取成员，或者业务逻辑对“成员必须完整”特别敏感，那么仍然要考虑先调用 `loadMembersIfNeeded()`。

## 这次排查得到的事实

### 1. 当前项目没有开启 `lazyLoadMembers`

项目里 Matrix 客户端是在 [src/services/Matrix/client.ts](../src/services/Matrix/client.ts) 中启动的。

当前代码是直接调用：

```ts
this.AuthenticatedMatrixClient.startClient()
```

没有向 `startClient` 传入 `lazyLoadMembers: true`。

### 2. `lazyLoadMembers` 是 `startClient` 的同步选项，不是 `createClient` 的基础构造选项

这意味着：

- `createClient({...})` 时没配，不代表后面一定有问题
- 真正决定是否懒加载成员的是 `startClient(opts)` 传入的选项

### 3. 当前项目已经在同步完成后刷新房间数据

项目里通过 `ClientEvent.Sync` 的 `PREPARED` 状态，触发一次同步完成事件；房间列表会在这个阶段再次刷新。

这意味着：

- 刚启动客户端时第一次读取房间/成员，可能为空或不完整
- 但同步完成后再读，结果通常会稳定很多

## 什么时候 `getMembers()` 就够了

以下情况，一般可以继续直接使用 `getMembers()`：

- 当前项目保持现状，没有开启 `lazyLoadMembers`
- 这段逻辑发生在同步完成之后
- 只是用于展示当前房间成员、做普通筛选、做常规匹配

当前项目里，大多数现有用法都属于这一类。

## 什么时候应该考虑 `loadMembersIfNeeded()`

以下情况，建议优先考虑在读取成员前先执行：

```ts
await room.loadMembersIfNeeded()
const members = room.getMembers()
```

适用场景：

- 这段逻辑要求“成员必须尽量完整”
- 判断结果会因为漏掉一个成员而出错
- 逻辑发生在同步刚启动后，不能保证已经到 `PREPARED`
- 出现过偶发性的成员缺失、房间匹配错误、房间过滤失效

## 对当前项目的建议

### 先不改全局

当前项目不建议把所有 `getMembers()` 一刀切改成先 `loadMembersIfNeeded()`。

原因：

- 现状大部分场景已经足够
- 全部改成异步会把很多同步调用链都改复杂
- 目前没有明确证据说明项目已经持续出现成员不全问题

### 如果后面真的出问题，再只改关键入口

优先关注这类函数：

- 对房间成员做强校验的函数
- 依赖成员完整性做房间匹配的函数
- 会因为漏成员而误判业务状态的函数

不必优先处理这类函数：

- 只是读取单个发送者资料的展示逻辑
- 允许短暂不完整的普通 UI 展示逻辑

## 可执行判断标准

后面如果再遇到类似问题，可以按下面判断：

### 可以先不加 `loadMembersIfNeeded()`

- 没开启 `lazyLoadMembers`
- 逻辑运行在同步完成之后
- 没有出现成员偶发不全的实际问题

### 应该考虑加 `loadMembersIfNeeded()`

- 开启了 `lazyLoadMembers`
- 逻辑在同步完成前就会触发
- 房间匹配、成员过滤、业务校验出现偶发误判
- 明确发现 `getMembers()` 返回人数不稳定

## 一句话版

当前项目下：

- 默认先用 `getMembers()` 就行
- 只有当业务确实要求“成员必须完整”，或者已经观察到偶发不全，再在关键路径前补 `await loadMembersIfNeeded()`