# 纯对话核心 实施计划

> 目标：在最简环境（终端/Web）中完成 LLM 对话 + 长期记忆系统全部核心能力。
> 不涉及 QQ 接入。验证通过后再接展示层。


## 一、项目骨架（1 天）

- [x] 创建项目目录结构（从 Pancake FastAPI 复制改造）
- [x] 配置 requirements.txt（FastAPI、SQLModel、ChromaDB、openai、structlog 等）
- [x] 搭建 FastAPI 应用入口（main.py）
- [ ] 配置文件加载（TOML 格式）：bot.toml + model.toml（当前用 .env + pydantic-settings）
- [ ] structlog 日志配置（当前沿用原 Pancake 标准 logging 体系）


## 二、LLM 对话引擎（2 天）

- [x] 封装硅基流动 API 调用（engine.py，OpenAI 兼容接口）
- [x] 人设 Prompt 模板系统（persona.py + persona.txt）
- [x] 对话生成接口（engine.chat()）
- [ ] 流式输出支持（chat_stream() 已写，未接入接口）
- [ ] Token 预算管理


## 三、基础对话交互（1 天）

- [ ] 命令行交互模式（当前用 Swagger UI /curl 代替）
- [ ] 最简 Web 聊天页面


## 四、短期记忆（1 天）

- [x] 消息窗口管理（short_term.py，deque 滑动窗口）
- [x] 上下文拼接（/chat 中自动拼接）
- [x] 多会话隔离（session_id + user_id 组合键）


## 五、数据库 & 向量库（4 天）

- [x] SQLModel 建全部表模型（db_models.py：7 张表）
- [x] ChromaDB 初始化（vector_store.py，持久化到 data/chroma/）
- [x] Embedding 统一接口（engine.embed()，走硅基流动）
- [ ] 消息持久化（messages 表未自动写入）


## 六、长期记忆存储 & 检索（5 天）

- [x] 记忆写入（save_memory → SQLite + ChromaDB 双写）
- [x] 语义检索（ChromaDB 向量相似度）
- [x] 关键词检索（SQLite LIKE）
- [x] 混合检索（语义 + 关键词合并去重）
- [x] 检索结果注入 LLM prompt
- [ ] 时间衰减（未实现）


## 七、人物画像系统（5 天）

- [x] 画像数据结构
- [x] 画像初始化（首次对话自动创建）
- [x] 画像提取（extract_facts.txt + LLM 推理模型）
- [x] 画像更新（profile.txt + 增量合并）
- [x] 画像注入（每次对话拼入 system prompt）
- [ ] 画像版本管理（DB 有 version 字段，接口未暴露）


## 八、自动写回（5 天）

- [ ] 写回触发时机：每次 LLM 回复后异步执行
- [ ] 事实提取：LLM 从本轮对话中提取用户的关键事实
- [ ] 摘要生成：LLM 生成本轮对话的内容摘要
- [ ] 事实写回画像：新事实合并到用户画像
- [ ] 摘要写回向量库：摘要 embedding 后存入 ChromaDB
- [ ] 写回频率控制：可配置触发阈值（消息数/时间间隔）


## 九、Episode 记忆（3 天）

- [ ] 对话分段：检测话题切换或时间窗口到期，切分对话
- [ ] Episode 生成：LLM 将一段对话整理为经历片段（时间+参与人+话题+关键内容+结论）
- [ ] Episode 存储：写入 episodes 表 + embedding 存入向量库
- [ ] Episode 检索：按时间/话题/参与人查询


## 十、知识图谱（5 天）

- [ ] 实体抽取：LLM 从对话中识别节点（人/话题/事件/概念）
- [ ] 关系抽取：LLM 识别实体间关系（喜欢/讨厌/提及/属于/知道）
- [ ] 图谱存储：节点写入 graph_nodes 表，关系写入 graph_edges 表
- [ ] 图谱查询接口：查某用户的所有关系、查某话题的相关实体
- [ ] 图谱可视化（可选）：简单的关系图展示


## 十一、记忆维护（3 天）

- [ ] 定时任务框架：每天/每周执行的记忆维护任务
- [ ] 相似记忆合并：LLM 判断两条记忆是否表达相同意思 → 合并
- [ ] 重要性强化：被多次检索到的记忆提升 importance
- [ ] 衰减遗忘：长时间未被检索的记忆降低 decay_factor，低于阈值标记为 forgotten


## 十二、调试 & 验证工具（2 天）

- [ ] 管理命令终端：查询用户记忆、查看画像、删除记忆、查看检索结果
- [ ] 调试日志增强：每次 LLM 调用记录完整 prompt + 检索结果 + 回复
- [ ] 记忆系统自检：检查 embedding 可用性、向量库连接、数据一致性


## 十三、全链路打磨（5 天）

- [ ] 端到端对话测试：模拟真实多轮对话，验证记忆检索和画像更新效果
- [ ] 检索质量调优：调整 top-K、混合检索权重、时间衰减曲线
- [ ] 画像准确性验证：检查提取的事实是否准确、合并是否合理
- [ ] 边界情况：空画像用户、超长对话、高频消息、特殊字符
- [ ] 性能优化：Embedding 结果缓存、LLM 请求去重