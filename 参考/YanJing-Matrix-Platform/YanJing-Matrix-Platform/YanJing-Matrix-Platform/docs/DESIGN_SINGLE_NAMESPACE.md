# Nanobot 单命名空间多用户部署设计文档

**版本:** 1.4
**日期:** 2026-03-04
**状态:** P0（本版）已修复，P1/P2 待优化

---

## 目录

1. [概述](#一概述)
2. [架构设计](#二架构设计)
3. [数据模型](#三数据模型)
4. [资源命名规范](#四资源命名规范)
5. [访问方案](#五访问方案)
6. [用户管理](#六用户管理)
7. [运维管理](#七运维管理)
8. [监控与日志](#八监控与日志)
9. [性能优化](#九性能优化)
10. [安全设计](#十安全设计)
11. [容量规划](#十一容量规划)
12. [实施步骤](#十二实施步骤)

---

## 一、概述

### 1.1 设计目标

- **大规模支持**: 单个 namespace 内支持 10,000+ 用户实例
- **高效管理**: 简化运维操作，避免 namespace 膨胀
- **外部集成**: user_id 由外部系统提供，支持与现有用户体系对接
- **资源隔离**: 通过标签和资源配额实现用户级隔离
- **可扩展性**: 支持水平扩展和多区域部署

### 1.2 适用场景

| 场景 | 适用性 |
|------|--------|
| 小型部署 (< 100 用户) | 不推荐，使用多 namespace 更简单 |
| 中型部署 (100-1,000 用户) | 适用 |
| 大型部署 (1,000-10,000 用户) | 推荐 |
| 超大规模 (> 10,000 用户) | 推荐，需配合多分片 |

### 1.3 设计决策

| 决策项 | 选择 | 原因 |
|--------|------|------|
| Namespace 数量 | 单个（可分片） | 减少 etcd 压力，超过 5000 用户自动分片，每 namespace 最多 5000 用户 |
| 用户标识 | 外部 user_id | 与现有用户系统集成 |
| 资源命名 | user_id 前缀 | 便于批量管理和查询 |
| 访问方式 | Ingress | 支持域名访问，无端口限制 |
| 数据存储 | PersistentVolumeClaim | 生产环境支持跨节点迁移，支持快照和备份 |
| 并发控制 | flock 文件锁 | 保证 registry.json 修改的原子性，避免数据竞争 |

---

## 二、架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         minikube Cluster                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │         nanobot-users (namespace)                         │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐    │ │
│  │  │       gateway-dep-00001001 (alice)            │    │ │
│  │  │                                                  │    │ │
│  │  │  ┌─────────────┐ ┌─────────────┐          │    │ │
│  │  │  │  nanobot    │ │  agent1     │          │    │ │
│  │  │  │  (主服务)   │ │  (bot)      │          │    │ │
│  │  │  └─────────────┘ └─────────────┘          │    │ │
│  │  │                    ┌─────────────┐          │    │ │
│  │  │                    │  agent2     │  ...    │    │ │
│  │  │                    │  (bot)      │          │    │ │
│  │  │                    └─────────────┘          │    │ │
│  │  │              ↑                             │    │ │
│  │  │              │ (共享存储)                  │    │ │
│  │  │  ┌────────────────────────────────┐         │    │ │
│  │  │  │  emptyDir: shared-workspace │         │    │ │
│  │  │  └────────────────────────────────┘         │    │ │
│  │  └──────────────────────────────────────────────────┘    │ │
│  │         │                                              │ │
│  │  ┌──────────────────────────────────────────────────┐    │ │
│  │  │       gateway-dep-00001002 (bob)              │    │ │
│  │  │  ┌─────────────┐ ┌─────────────┐          │    │ │
│  │  │  │  nanobot    │ │  agent1     │          │    │ │
│  │  │  └─────────────┘ └─────────────┘          │    │ │
│  │  └──────────────────────────────────────────────────┘    │ │
│  │         │                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐              │ │
│  │  │gateway-svc   │  │gateway-svc   │              │ │
│  │  │  00001001    │  │  00001002    │              │ │
│  │  └──────────────┘  └──────────────┘              │ │
│  │                                                          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │ │
│  │  │ config    │  │ config    │  │ config    │             │ │
│  │  │00001001   │  │00001002   │  │00001003   │             │ │
│  │  └──────────┘  └──────────┘  └──────────┘             │ │
│  │                                                          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │ │
│  │  │ secret    │  │ secret    │  │ secret    │             │ │
│  │  │00001001   │  │00001002   │  │00001003   │             │ │
│  │  └──────────┘  └──────────┘  └──────────┘             │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │         nanobot-ingress (统一入口)               │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │         nanobot-admin (namespace) - 管理资源            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │user-manager  │  │metrics       │  │monitoring    │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  宿主机数据目录 / PVC                          │
│  /home/k8s/nanobot-data/                                   │
│  ├── users/                                                  │
│  │   ├── 00001001/          # alice                         │
│  │   │   ├── config.json       # 用户配置                       │
│  │   │   ├── agents.json      # Agent 配置（动态）             │
│  │   │   ├── .meta/          # 元数据                          │
│  │   │   ├── workspace/       # 共享工作空间（多容器共享）       │
│  │   │   ├── sessions/       # 会话数据                        │
│  │   │   └── memory/        # 记忆数据                        │
│  │   ├── 00001002/          # bob                           │
│  │.  └── 00001003/          # charlie                       │
│  ├── registry.json      # 用户注册表                                  │
│  └── .lock              # 文件锁                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 组件说明

| 组件 | 类型 | 用途 |
|------|------|------|
| nanobot-users | Namespace | 所有用户实例所在命名空间 |
| gateway-dep-{user_id} | Deployment | 用户网关部署（包含多个容器） |
| gateway-svc-{user_id} | Service | 用户服务（ClusterIP，只暴露 nanobot 端口） |
| config-{user_id} | ConfigMap | 用户非敏感配置（含 agent 配置） |
| secret-{user_id} | Secret | 用户敏感信息（含 agent tokens） |
| nanobot-ingress | Ingress | 统一访问入口 |
| nanobot-admin | Namespace | 管理资源命名空间 |

### 2.3 多容器 Pod 设计

每个用户的 Pod 包含以下容器：

| 容器 | 用途 | 启动条件 | 端口暴露 |
|------|------|-----------|---------|
| nanobot | 主服务，处理用户请求 | 始终运行 | 18790 |
| agent1 | 特定 bot（如天气查询） | 用户活跃时 | 无（内部通信） |
| agent2 | 特定 bot（如代码助手） | 用户活跃时 | 无（内部通信） |
| agentN | 可扩展的 agent | 按需启动 | 无（内部通信） |

**容器间通信方式**：
- 通过 `emptyDir` 共享工作空间
- 通过 `localhost` 进行进程间通信
- nanobot 容器作为主入口，协调其他 agent 容器

---

## 三、数据模型

### 3.1 用户注册表 (registry.json)

```json
{
  "users": {
    "00001001": "alice",
    "00001002": "bob",
    "00001003": "charlie"
  },
  "usernames": {
    "alice": "00001001",
    "bob": "00001002",
    "charlie": "00001003"
  }
}
```

**字段说明：**
- `users`: user_id（8位格式） → username 映射，便于按 ID 查询
- `usernames`: username → user_id（8位格式）映射，便于按用户名查询

**注意：** registry.json 中的 user_id 必须使用 8 位格式（如 00001001），与资源命名保持一致。

### 3.2 用户元数据 (.meta/)

```
/home/k8s/nanobot-data/users/{user_id}/.meta/
├── username    # 用户名
└── user_id     # 用户 ID（格式化后）
```

### 3.3 user_id 规范

| 规范 | 值 |
|------|-----|
| 类型 | 整数 |
| 范围 | 1 - 99999999 (8位数字) |
| 格式化 | 8 位数字，前面补零（如 1001 → 00001001） |
| 唯一性 | 全局唯一 |
| 分片策略 | user_id % 1000 = shard_id (可选) |

**说明**: 扩展到 8 位以支持更大规模部署。如果使用 5 位格式，上限为 99,999 用户，对于企业级部署可能不足。8 位格式支持最多 99,999,999 用户。

### 3.4 数据目录结构

```
/home/k8s/nanobot-data/
├── users/                           # 用户数据目录（生产环境建议使用 PV/PVC）
│   ├── 00001001/                    # 使用格式化的 user_id
│   │   ├── config.json               # nanobot 主配置
│   │   ├── agents.json              # Agent 配置（动态管理）
│   │   ├── .meta/                   # 元数据
│   │   │   ├── username            # alice
│   │   │   └── user_id             # 00001001
│   │   ├── workspace/                # 共享工作空间（多容器共享）
│   │   │   ├── TOOLS.md
│   │   │   ├── USER.md
│   │   │   ├── HEARTBEAT.md
│   │   │   └── ...
│   │   ├── sessions/                 # 会话数据
│   │   │   └── *.aon
│   │   └── memory/                  # 记忆数据
│   │       ├── MEMORY.md
│   │       └── HISTORY.md
│   ├── 00001002/
│   └── 00001003/
├── registry.json                     # 用户注册表（使用 flock 并发控制）
└── .lock                           # 文件锁（用于并发访问 registry.json）
```

**注意**: 在生产环境中，用户数据目录应该由 Kubernetes PersistentVolume 提供，而不是直接使用宿主机路径。

### 3.5 Agent 配置模型 (agents.json)

```json
{
  "agents": {
    "weather-bot": {
      "name": "weather-bot",
      "image": "my-weather-bot:latest",
      "enabled": true,
      "command": ["weather-bot", "serve"],
      "resources": {
        "requests": {
          "cpu": "50m",
          "memory": "64Mi"
        },
        "limits": {
          "cpu": "200m",
          "memory": "256Mi"
        }
      },
      "env": {
        "API_KEY": "weather_api_key"
      },
      "mounts": ["workspace"]
    },
    "code-assistant": {
      "name": "code-assistant",
      "image": "code-assistant:v1.2",
      "enabled": false,
      "command": ["assistant"],
      "resources": {
        "requests": {
          "cpu": "100m",
          "memory": "128Mi"
        }
      }
    }
  }
}
```

**字段说明：**
- `name`: Agent 唯一标识
- `image`: Agent 镜像
- `enabled`: 是否启用（可动态切换）
- `command`: 容器启动命令
- `resources`: 资源限制
- `env`: 环境变量（可引用 Secret）
- `mounts`: 需要挂载的卷（如 workspace）

---

## 四、资源命名规范

### 4.1 命名规则

| 资源类型 | 命名格式 | 示例 |
|----------|----------|------|
| Deployment | `gateway-dep-{user_id}` | gateway-dep-00001001 |
| Service | `gateway-svc-{user_id}` | gateway-svc-00001001 |
| ConfigMap | `config-{user_id}` | config-00001001 |
| Secret | `secret-{user_id}` | secret-00001001 |
| PersistentVolumeClaim | `pvc-{user_id}` | pvc-00001001 |
| Pod | `gateway-dep-{user_id}-{suffix}` | gateway-dep-00001001-abc123 |

### 4.2 标签规范

所有资源使用统一标签：

```yaml
labels:
  app: nanobot                    # 应用标识
  component: gateway              # 组件类型
  user-id: "{user_id}"           # 用户 ID（格式化）
  username: "{username}"         # 用户名
```

### 4.3 注解规范

```yaml
annotations:
  nanobot.io/data-dir: "{user_data_dir}"    # 数据目录路径
  nanobot.io/user-id: "{user_id}"           # 用户 ID
  nanobot.io/created-at: "{timestamp}"      # creation timestamp
```

---

## 五、存储方案（P0 优化）

### 5.1 存储架构选择

| 环境 | 存储方案 | 原因 |
|------|---------|------|
| 开发/测试（minikube） | hostPath | 简化部署，便于调试 |
| 生产环境 | Persistent PersistentVolumeClaim | 支持跨节点迁移，支持快照和备份 |
| 超大规模（>10000用户） | 分布式存储（Ceph/Rook） | 高可用，横向扩展 |

**重要**: hostPath 仅用于 minikube 等单节点开发环境，生产环境必须使用 PVC。

### 5.2 PVC 配置示例（生产环境）

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-00001001
  namespace: nanobot-users
  labels:
    app: nanobot
    component: user-data
    user-id: "00001001"
    username: "alice"
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: nanobot-storage  # 使用专用的 StorageClass
```

### 5.3 StorageClass 定义

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nanobot-storage
provisioner: kubernetes.io/aws-ebs  # 根据 K8s 提供商调整
parameters:
  type: gp3
  encrypted: "true"
  fsType: ext4
allowVolumeExpansion: true
reclaimPolicy: Retain  # 生产环境建议使用 Retain 以便手动清理
volumeBindingMode: WaitForFirstConsumer
```

### 5.4 多容器 Deployment 配置示例

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway-dep-00001001
  namespace: nanobot-users
  labels:
    app: nanobot
    component: gateway
    user-id: "00001001"
    username: "alice"
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nanobot
      user-id: "00001001"
  template:
    metadata:
      labels:
        app: nanobot
        user-id: "00001001"
        username: "alice"
    spec:
      restartPolicy: Always
      # 共享卷：emptyDir 用于容器间通信
      volumes:
      # 用户数据 PVC（主存储）
      - name: user-data
        persistentVolumeClaim:
          claimName: pvc-00001001
      # 共享工作空间（容器间共享）
      - name: shared-workspace
        emptyDir: {}

      containers:
      # ========== 主容器：nanobot ==========
      - name: nanobot
        image: nanobot:latest
        imagePullPolicy: IfNotPresent
        command: ["nanobot", "gateway"]
        ports:
        - containerPort: 18790
          name: gateway
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        volumeMounts:
        - name: user-data
          mountPath: /root/.nanobot
        - name: shared-workspace
          mountPath: /shared/workspace
        envFrom:
        - configMapRef:
            name: config-00001001
        - secretRef:
            name: secret-00001001
        livenessProbe:
          httpGet:
            path: /health
            port: 18790
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 18790
          initialDelaySeconds: 10
          periodSeconds: 5

      # ========== Agent 容器：weather-bot ==========
      - name: weather-bot
        image: my-weather-bot:latest
        imagePullPolicy: Always
        command: ["weather-bot", "serve"]
        resources:
          requests:
            cpu: "50m"
            memory: "64Mi"
          limits:
            cpu: "200m"
            memory: "256Mi"
        volumeMounts:
        - name: shared-workspace
          mountPath: /shared/workspace
        env:
        - name: NANOBOT_ENDPOINT
          value: "http://localhost:18790"
        - name: WORKSPACE_DIR
          value: "/shared/workspace"
        envFrom:
        - secretRef:
            name: secret-00001001
            optional: true
        # 注意：是否启用由 Deployment 模板决定。
        # 修改 agents.json 后需同步更新 PodTemplate 并执行滚动更新才会生效。

      # ========== Agent Agent：code-assistant ==========
      - name: code-assistant
        image: code-assistant:v1.2
        imagePullPolicy: Always
        command: ["assistant", "run"]
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "400m"
            memory: "512Mi"
        volumeMounts:
        - name: shared-workspace
          mountPath: /shared/workspace
        env:
        - name: NANOBOT_ENDPOINT
          value: "http://localhost:18790"
        - name: WORKSPACE_DIR
          value: "/shared/workspace"
        # 依赖 nanobot 容器就绪后启动
        livenessProbe:
          exec:
            command: ["sh", "-c", "curl -s http://localhost:8080/health || exit 1"]
          initialDelaySeconds: 30
          periodSeconds: 30

      # ========== 更多 Agent 容器可按需扩展（通过更新 Deployment 模板并滚动更新） ==========
```

### 5.5 多容器通信机制

| 通信方式 | 说明 | 适用场景 |
|---------|------|---------|
| **共享 emptyDir** | 容器共享 `/shared/workspace` 目录 | 共享工作文件、临时数据 |
| **localhost HTTP** | nanobot 暴露 18790，agent 通过 localhost:18790 调用 | Agent 主动调用 nanobot API |
| **gRPC over Unix Socket** | 通过 Unix Domain Socket 通信 | 高性能、低延迟的场景 |
| **消息队列** | 使用共享的 Redis/Kafka | 异步通信、事件驱动 |

**推荐配置**：
1. nanobot 作为主入口，提供 HTTP API
2. Agent 通过 `http://localhost:18790` 与 nanobot 通信
3. 共享 `/shared/workspace` 用于交换工作文件

### 5.6 存储迁移策略

如果从 hostPath 迁移到 PVC：

1. 创建 PVC 并绑定到 hostPath 数据
2. 更新 Deployment 使用 PVC
3. 验证数据完整性
4. 清理旧 hostPath 引用

---

## 六、并发控制机制（P0 优化）

### 6.1 并发访问风险

`registry.json` 是共享资源，多进程同时修改可能导致：
- 数据丢失
- 竞态条件
- 损坏的 JSON 文件

### 6.2 文件锁实现

使用 Linux `flock` 命令实现原子操作：

```bash
#!/bin/bash
# 在 user-manager.sh 中使用

LOCK_FILE="/home/k8s/nanobot-data/.lock"
REGISTRY_FILE="/home/k8s/nanobot-data/registry.json"
LOCK_TIMEOUT=30  # 30秒超时

# 获取独占锁，超时后退出
exec 9>"$LOCK_FILE"
flock -x -w $LOCK_TIMEOUT 9 || {
    echo "错误：无法获取文件锁，操作超时"
    exit 1
}

# 在锁保护的临界区内操作注册表
# ...

# 脚本结束时自动释放锁
trap 'flock -u 9; exec 9>&-' EXIT
```

### 6.3 锁超时处理

| 场景 | 处理方式 |
|------|---------|
| 锁获取超时 | 优雅退出，返回错误码 |
| 持有锁的进程崩溃 | `flock` 在进程结束时自动释放 |
| 死锁检测 | 记录锁获取时间，超时强制释放（可选） |

### 6.4 注册表操作示例

```bash
# 添加用户到注册表（带锁保护）
add_to_registry() {
    local user_id=$1
    local username=$2

    (
        flock -x -w $LOCK_TIMEOUT 9 || exit 1

        # 读取现有注册表
        local registry=$(cat "$REGISTRY_FILE")

        # 检查是否已存在
        if echo "$registry" | jq -e ".users[\"$user_id\"]" > /dev/null 2>&1; then
            echo "错误：user_id $user_id 已存在"
            exit 1
        fi

        # 更新注册表
        echo "$registry" | jq \
            --arg uid "$user_id" \
            --arg name "$username" \
            '.users[$uid] = $name | .usernames[$name] = $uid' > "$REGISTRY_FILE.tmp"

        # 原子替换
        mv "$REGISTRY_FILE.tmp" "$REGISTRY_FILE"
    ) 9>"$LOCK_FILE"
}
```

### 6.5 注册表一致性检查

定期检查注册表与实际 K8s 资源的一致性：

```bash
#!/bin/bash
# consistency-check.sh

REGISTRY_FILE="/home/k8s/nanobot-data/registry.json"
NAMESPACE="nanobot-users"

# 从注册表获取用户
registry_users=$(jq -r '.users | keys[]' "$REGISTRY_FILE")

# 从 K8s 获取用户
k8s_users=$(kubectl get deployments -n $NAMESPACE \
    -l app=nanobot -o jsonpath='{.items[*].metadata.labels.user-id}')

# 比较差异
echo "注册表中但不在 K8s 中的用户："
for user in $registry_users; do
    if ! echo "$k8s_users" | grep -q "^$user$"; then
        echo "  - $user"
    fi
done

echo "K8s 中但不在注册表中的用户："
for user in $k8s_users; do
    if ! echo "$registry_users" | grep -q "^$user$"; then
        echo "  - $user"
    fi
done
```

---

## 七、访问方案

### 5.1 Ingress 方案

#### 5.1.1 路径路由方案（推荐，适用于大规模部署）

**原因：** 基于 host 的路由在 10,000+ 用户时会产生巨大的 Ingress 资源和 DNS 配置负担。路径路由使用单个 Ingress 规则，性能更好且易于管理。

**配置示例**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nanobot-ingress
  namespace: nanobot-users
  annotations:
    # 使用正则捕获并保留原始业务路径
    nginx.ingress.kubernetes.io/rewrite-target: /$4
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    # 根据路径中的 user_id 动态选择后端服务
    nginx.ingress.kubernetes.io/use-regex: "true"
spec:
  ingressClassName: nginx
  rules:
  - host: "nanobot.local"
    http:
      paths:
      # 匹配 /u/{username} 或 /user/{user_id} 格式的路径
      - path: /(u|user)/([^/]+)(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: nanobot-router  # 使用内部路由服务
            port:
              number: 80
```

**说明：** 此方案需要配合内部路由服务（见 5.2 节），将路径中的 user_id 映射到对应的服务。

**访问 URL**

| 用户 | 访问 URL（按用户名） | 访问 URL（按 user_id） |
|------|---------------------|------------------------|
| alice | http://nanobot.local/u/alice | http://nanobot.local/user/00001001 |
| bob | http://nanobot.local/u/bob | http://nanobot.local/user/00001002 |
| charlie | http://nanobot.local/u/charlie | http://nanobot.local/user/00001003 |

#### 5.1.2 Host 路由方案（仅适用于小规模部署，< 100 用户）

**警告：** 此方案在 10,000+ 用户时会产生巨大的 Ingress 资源和 DNS 配置负担，仅用于小规模测试环境。

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nanobot-ingress
  namespace: nanobot-users
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  rules:
  - host: "alice.nanobot.local"
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: gateway-svc-00001001
            port:
              number: 18790
  - host: "bob.nanobot.local"
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: gateway-svc-00001002
            port:
              number: 18790
```

### 5.2 内部路由服务（必需）

**目的：** 将路径中的 user_id/username 映射到对应的 Kubernetes Service，避免 Ingress 规则爆炸。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nanobot-router
  namespace: nanobot-users
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nanobot-router
  template:
    metadata:
      labels:
        app: nanobot-router
    spec:
      containers:
      - name: router
        image: nginx:alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - name: nginx-conf
          mountPath: /etc/nginx/conf.d
      volumes:
      - name: nginx-conf
        configMap:
          name: router-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: router-config
  namespace: nanobot-users
data:
  router.conf: |
    upstream gateway-00001001 {
        server gateway-svc-00001001.nanobot-users.svc.cluster.local:18790;
    }
    upstream gateway-00001002 {
        server gateway-svc-00001002.nanobot-users.svc.cluster.local:18790;
    }

    server {
        listen 80;
        server_name _;

        # 按 user_id 路由（8位格式）
        location /user/00001001 {
            rewrite ^/user/00001001/(.*) /$1 break;
            proxy_pass http://gateway-00001001;
        }

        location /user/00001002 {
            rewrite ^/user/00001002/(.*) /$1 break;
            proxy_pass http://gateway-00001002;
        }

        # 动态路由（使用 Lua 或外部服务）
        location ~ ^/user/(\d+)/(.*)$ {
          # 静态配置不处理动态用户，避免错误转发
          return 404;
        }
    }
```

**注意：** 上述静态配置仅用于小规模测试。对于 10,000+ 用户的部署，请使用下方的动态路由方案。

#### 5.2.3 动态路由方案（推荐，> 100 用户）

**目的：** 避免 Ingress 规则爆炸，使用单个路由服务处理所有用户请求。

**方案 A：使用 OpenResty + Lua（推荐）**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nanobot-router
  namespace: nanobot-users
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nanobot-router
  template:
    metadata:
      labels:
        app: nanobot-router
    spec:
      initContainers:
      - name: load-registry
        image: busybox:1.35
        command: ["sh", "-c", "cp /shared-data/registry.json /usr/local/openresty/nginx/conf/registry.json"]
        volumeMounts:
        - name: shared-data
          mountPath: /shared-data
        - name: nginx-conf
          mountPath: /usr/local/openresty/nginx/conf
      containers:
      - name: router
        image: openresty/openresty:alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - name: nginx-conf
          mountPath: /usr/local/openresty/nginx/conf
        - name: lua-scripts
          mountPath: /usr/local/openresty/lualib
      volumes:
      - name: shared-data
        hostPath:
          path: /home/k8s/nanobot-data
      - name: nginx-conf
        emptyDir: {}
      - name: lua-scripts
        configMap:
          name: router-lua-script
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: router-lua-script
  namespace: nanobot-users
data:
  router.lua: |
    local cjson = require "cjson"
    local registry_cache = {}
    local cache_time = 0
    local cache_ttl = 30  -- 30秒缓存

    -- 加载注册表
    function load_registry()
        local current_time = os.time()
        if current_time - cache_time < cache_ttl then
            return registry_cache
        end

        local file = io.open("/usr/local/openresty/nginx/conf/registry.json", "r")
        if not file then return nil end

        local content = file:read("*all")
        file:close()

        registry_cache = cjson.decode(content) or {}
        cache_time = current_time
        return registry_cache
    end

    -- 查找 user_id
    function lookup_user_id(username)
        local registry = load_registry()
        if not registry or not registry.usernames then return nil end

        local user_id = registry.usernames[username]
        if user_id then
            return string.format("%08d", tonumber(user_id))
        end
        return nil
    end

    return {
        lookup_user_id = lookup_user_id
    }
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-router-config
  namespace: nanobot-users
data:
  nginx.conf: |
    worker_processes auto;
    events { worker_connections 1024; }
    http {
        include mime.types;
        default_type application/octet-stream;

        lua_package_path "/usr/local/openresty/lualib/?.lua;;";

        resolver kube-dns.kube-system.svc.cluster.local valid=30s;

        server {
            listen 80;
            server_name _;

            location ~ ^/u/([^/]+)/(.*)$ {
                set $username $1;
                set $path_suffix $2;
                rewrite_by_lua_block {
                    local router = require("router")
                    local user_id = router.lookup_user_id(ngx.var.username)
                    if user_id then
                        ngx.var.backend = "gateway-svc-" .. user_id .. ".nanobot-users.svc.cluster.local:18790"
                        ngx.var.target_path = "/" .. ngx.var.path_suffix
                    else
                        ngx.status = 404
                        ngx.say("User not found")
                        ngx.exit(404)
                    end
                }
                proxy_pass http://$backend$target_path;
                proxy_set_header Host $host;
            }

            location ~ ^/user/(\d+)/(.*)$ {
                set $user_id $1;
                set $path_suffix $2;
                # 格式化为8位
                set_by_lua $formatted_id "
                    return string.format('%08d', tonumber(ngx.var.user_id))
                ";
                set $backend "gateway-svc-$formatted_id.nanobot-users.svc.cluster.local:18790";
                proxy_pass http://$backend/$path_suffix;
                proxy_set_header Host $host;
            }

            location /health {
                return 200 "OK\n";
                add_header Content-Type text/plain;
            }
        }
    }
```

**方案 B：使用 Go/Python 动态路由服务**

对于复杂路由逻辑，可以使用自定义路由服务：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nanobot-router
  namespace: nanobot-users
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nanobot-router
  template:
    metadata:
      labels:
        app: nanobot-router
    spec:
      containers:
      - name: router
        image: nanobot-router:latest
        ports:
        - containerPort: 8080
        env:
        - name: REGISTRY_FILE
          value: "/data/registry.json"
        volumeMounts:
        - name: shared-data
          mountPath: /data
      volumes:
      - name: shared-data
        hostPath:
          path: /home/k8s/nanobot-data
```

#### 5.2.4 访问方式

| 方式 | URL 格式 | 示例 |
|------|----------|------|
| 按用户名 | `http://nanobot.local/u/{username}/` | http://nanobot.local/u/alice/ |
| 按 user_id | `http://nanobot.local/user/{user_id}/` | http://nanobot.local/user/00001001/ |

**优势：**
- 单个 Ingress 规则支持所有用户
- 无需管理大量 DNS 记录
- 路由配置自动从注册表更新

---

## 八、用户管理

### 8.1 用户生命周期

```
┌─────────────┐
│   创建      │
│   (add-user)│
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   启动      │───▶│   停止      │───▶│   删除      │
│  (start)    │    │   (stop)     │    │(remove-user)│
└──────┬──────┘    └──────┬──────┘    └─────────────┘
       │                  │
       ▼                  ▼
  ┌─────────┐       ┌─────────┐
  │ 运行中  │       │ 已停止  │
  └─────────┘       └─────────┘
```

### 8.2 管理命令

#### 用户管理命令

| 命令 | 参数 | 说明 |
|------|------|------|
| add-user | `<username> <user_id>` | 添加新用户 |
| remove-user | `<username>`\|`<user_id>` | 移除用户 |
| list-users | - | 列出所有用户 |
| start | `<username>`\|`<user_id>` | 启动用户服务 |
| stop | `<username>`\|`<user_id>` | 停止用户服务 |
| restart | `<username>`\|`<user_id>` | 重启用户服务 |
| status | `[username]\|[user_id]` | 查看用户状态 |
| edit-config | `<username>`\|`<user_id>` | 编辑用户配置 |
| logs | `<username>`\|`<user_id>` | 查看用户日志 |
| batch-start | - | 启动所有用户服务 |
| batch-stop | - | 停止所有用户服务 |

#### Agent 管理命令

| 命令 | 参数 | 说明 |
|------|------|------|
| add-agent | `<username> <user_id> <agent_name> <config>` | 为用户添加 Agent |
| remove-agent | `<username> <user_id> <agent_name>` | 移除用户 Agent |
| enable-agent | `<username> <user_id> <agent_name>` | 启用 Agent |
| disable-agent | `<username> <user_id> <agent_name>` | 禁用 Agent |
| list-agents | `<username>\|<user_id>` | 列出用户的 Agent |
| restart-agent | `<username> <user_id> <agent_name>` | 重启特定 Agent |
| agent-logs | `<username> <user_id> <agent_name>` | 查看 Agent 日志 |

**Agent 管理示例**：

```bash
# 为用户 alice 添加 weather-bot agent
./user-manager-v3.sh add-agent alice 1001 weather-bot <<'EOF'
{
  "image": "my-weather-bot:latest",
  "enabled": true,
  "command": ["weather-bot", "serve"],
  "resources": {
    "requests": {"cpu": "50m", "memory": "64Mi"},
    "limits": {"cpu": "200m", "memory": "256Mi"}
  }
}
EOF

# 启用 Agent
./user-manager-v3.sh enable-agent alice 1001 weather-bot

# 列出用户 Agent
./user-manager-v3.sh list-agents alice

# 禁用 Agent（停止容器）
./user-manager-v3.sh disable-agent alice 1001 weather-bot
```

### 8.3 外部集成

#### Python SDK 示例

```python
from nanobot_manager import NanobotUserManager

manager = NanobotUserManager()

# 添加用户（外部系统分配 user_id）
manager.add_user("alice", 1001)
manager.add_user("bob", 1002)

# 管理用户
manager.start_user(1001)
manager.stop_user("bob")

# 批量操作
for user_id in range(1000, 1010):
    manager.add_user(f"user_{user_id}", user_id)
```

#### REST API 示例

```bash
# 添加用户
curl -X POST http://api.nanobot.local/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "user_id": 1001}'

# 启动用户
curl -X POST http://api.nanobot.local/api/users/1001/start

# 查看用户
curl http://api.nanobot.local/api/users

# 删除用户
curl -X DELETE http://api.nanobot.local/api/users/alice
```

---

## 九、Namespace 分片策略（P1 优化）

### 9.1 为什么需要分片

单个 namespace 包含大量资源（40,000+ = 4资源 × 用户数）可能导致：
- `kubectl get` 操作变慢（etcd 查询压力大）
- 列表查询超时
- 控制器负载过高

### 9.2 分片策略

**推荐分片大小**: 每 namespace 最多 5,000 用户

**分片计算**: `shard_id = floor(user_id / 5000)`（使用整数除法）

**注意：** 此处的 `user_id` 指未格式化的整数 ID，而非 8 位格式的字符串 ID。

| shard_id | Namespace 名称 | user_id 范围 |
|----------|----------------|---------------|
| 0 | nanobot-users-0 | 0 - 4999 |
| 1 | nanobot-users-1 | 5000 - 9999 |
| 2 | nanobot-users-2 | 10000 - 14999 |
| 3 | nanobot-users-3 | 15000 - 19999 |
| ... | ... | ... |

**示例：**

- 10,000 用户 → 分为 2 个 namespace（nanobot-users-0, nanobot-users-1）
- 50,000 用户 → 分为 10 个 namespace（nanobot-users-0 到 nanobot-users-9）
- 100,000 用户 → 分为 20 个 namespace（nanobot-users-0 到 nanobot-users-19）

**重要：** 使用整数除法而非取模运算，确保每个 namespace 达到最大容量后才创建新的 namespace。

### 9.3 分片实现示例

```bash
#!/bin/bash
# 获取 user_id 对应的 namespace
get_namespace() {
    local user_id=$1
    local shard_id=$((user_id / 5000))
    echo "nanobot-users-${shard_id}"
}

# 使用示例
user_id=1001
namespace=$(get_namespace $user_id)
echo "user_id $user_id belongs to namespace: $namespace"
# 输出: user_id 1001 belongs to namespace: nanobot-users-0

user_id=5001
namespace=$(get_namespace $user_id)
echo "user_id $user_id belongs to namespace: $namespace"
# 输出: user_id 5001 belongs to namespace: nanobot-users-1
```

### 9.4 自动分片创建

当添加用户时自动创建 namespace（如果不存在）：

```bash
# 确保命名空间存在
ensure_namespace() {
    local user_id=$1
    local namespace=$(get_namespace $user_id)

    if ! kubectl get namespace "$namespace" > /dev/null 2>&1; then
        kubectl create namespace "$namespace"
        echo "创建 namespace: $namespace"
    fi
}
```

### 9.5 分片查询

```bash
# 查询特定分片的所有用户
query_shard_users() {
    local shard_id=$1
    local namespace="nanobot-users-${shard_id}"

    if ! kubectl get namespace "$namespace" > /dev/null 2>&1; then
        echo "Namespace $namespace 不存在"
        return 1
    fi

    kubectl get deployments -n "$namespace" -l app=nanobot \
        -o jsonpath='{range .items[*]}{.metadata.labels.user-id}{"\t"}{.metadata.labels.username}{"\n"}{end}'
}

# 查询所有存在的分片
query_all_shards() {
    for shard in $(kubectl get ns -o name | grep -oP 'nanobot-users-\K\d+' | sort -n); do
        echo "=== 分片 $shard ==="
        query_shard_users $shard
    done
}

# 获取当前分片数
get_shard_count() {
    kubectl get ns -o name | grep -c 'nanobot-users-'
}
```

---

## 十、运维管理

### 10.1 批量操作

#### 查询操作

```bash
# 获取所有用户（单 namespace）
kubectl get all -n nanobot-users -l app=nanobot

# 获取所有用户（多分片）- 动态遍历实际存在的分片
for shard in $(kubectl get ns -o name | grep -oP 'nanobot-users-\K\d+' | sort -n); do
    kubectl get all -n nanobot-users-${shard} -l app=nanobot
done

# 获取特定用户（需要先计算分片）
user_id=1001
shard=$((user_id / 5000))
kubectl get all -n nanobot-users-${shard} -l user-id=$(printf "%08d" $user_id)

# 获取所有处于 Running 状态的 Pod（单分片）
kubectl get pods -n nanobot-users -l app=nanobot \
  -o jsonpath='{range .items[?(@.status.phase=="Running")]}{.metadata.name}{"\n"}{end}'

# 获取所有分片中的 Running Pod
for shard in $(kubectl get ns -o name | grep -oP 'nanobot-users-\K\d+' | sort -n); do
    kubectl get pods -n nanobot-users-${shard} -l app=nanobot \
      -o jsonpath='{range .items[?(@.status.phase=="Running")]}{.metadata.namespace}{"\t"}{.metadata.name}{"\n"}{end}'
done
```

#### 批量启动/停止

```bash
# 停止所有用户（单 namespace）
kubectl scale deployment -n nanobot-users -l app=nanobot --replicas=0

# 停止所有用户（多分片）- 动态遍历实际存在的分片
for shard in $(kubectl get ns -o name | grep -oP 'nanobot-users-\K\d+' | sort -n); do
    kubectl scale deployment -n nanobot-users-${shard} -l app=nanobot --replicas=0
done

# 启动所有用户（单 namespace）
kubectl scale deployment -n nanobot-users -l app=nanobot --replicas=1

# 启动所有用户（多分片）
for shard in $(kubectl get ns -o name | grep -oP 'nanobot-users-\K\d+' | sort -n); do
    kubectl scale deployment -n nanobot-users-${shard} -l app=nanobot --replicas=1
done

# 按范围启动（单分片内）
kubectl scale deployment -n nanobot-users \
  -l "user-id in (00001001,00001002,00001003)" --replicas=1
```

### 10.2 数据备份

#### 备份脚本

```bash
#!/bin/bash
# backup-users.sh

BACKUP_DIR="/backup/nanobot/$(date +%Y%m%d)"
USER_DATA_DIR="/home/k8s/nanobot-data"
REGISTRY_FILE="$USER_DATA_DIR/registry.json"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份用户数据
tar -czf "$BACKUP_DIR/users.tar.gz" "$USER_DATA_DIR/users"

# 备份注册表
cp "$REGISTRY_FILE" "$BACKUP_DIR/registry.json"

# 备份 Kubernetes 资源（单 namespace）
kubectl get all,cm,secret,pvc -n nanobot-users -o yaml > "$BACKUP_DIR/resources.yaml"

# 备份 Kubernetes 资源（多分片）- 动态遍历实际存在的分片
for shard in $(kubectl get ns -o name | grep -oP 'nanobot-users-\K\d+' | sort -n); do
    kubectl get all,cm,secret,pvc -n nanobot-users-${shard} -o yaml > "$BACKUP_DIR/resources-${shard}.yaml"
done

echo "备份完成: $BACKUP_DIR"
```

#### 恢复脚本

```bash
#!/bin/bash
# restore-users.sh

BACKUP_DIR="$1"
USER_DATA_DIR="/home/k8s/nanobot-data"
REGISTRY_FILE="$USER_DATA_DIR/registry.json"

if [ -z "$BACKUP_DIR" ]; then
    echo "用法: $0 <backup_dir>"
    exit 1
fi

# 恢复用户数据
tar -xzf "$BACKUP_DIR/users.tar.gz" -C "$USER_DATA_DIR"

# 恢复注册表
cp "$BACKUP_DIR/registry.json" "$REGISTRY_FILE"

# 恢复 Kubernetes 资源（单 namespace）
kubectl apply -f "$BACKUP_DIR/resources.yaml"

# 恢复 Kubernetes 资源（多分片）- 遍历备份文件
for backup_file in "$BACKUP_DIR"/resources-*.yaml; do
    if [ -f "$backup_file" ]; then
        kubectl apply -f "$backup_file"
    fi
done

echo "恢复完成"
```

### 10.3 故障排查

#### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Pod 无法启动 | 配置错误或资源不足 | 查看 Pod 日志，检查资源配额 |
| PVC 绑定失败 | 存储类配置错误 | 检查 StorageClass 和节点资源 |
| service 无法访问 | 标签不匹配 | 检查 service selector 是否正确 |
| 数据目录权限问题 | 文件所有者错误 | 运行 `chown -R uid:gid` 修正 |
| user_id 冲突 | 重复添加用户 | 检查注册表 |
| 文件锁超时 | 并发操作冲突 | 等待前一个操作完成，检查 .lock 文件 |

#### 诊断命令

```bash
# 检查 Pod 状态
kubectl describe pod -n nanobot-users -l user-id=00001001

# 检查 PVC 状态
kubectl get pvc -n nanobot-users -l user-id=00001001

# 检查事件
kubectl get events -n nanobot-users --sort-by='.lastTimestamp'

# 检查资源使用
kubectl top pods -n nanobot-users -l app=nanobot

# 检查节点资源
kubectl top nodes

# 检查文件锁
ls -la /home/k8s/nanobot-data/.lock
```

---

## 十一、监控与日志

### 11.1 Prometheus 监控

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-scrape-config
  namespace: nanobot-admin
data:
  scrape-config: |
    - job_name: 'nanobot-users'
      kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
          - nanobot-users
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_user_id]
        regex: (.+)
        action: keep
      - source_labels: [__address__, __meta_kubernetes_pod_label_user_id]
        regex: ([^:]+)(:.+)?;(.+)
        target_label: instance
        replacement: ${1}:18790
        action: replace
```

### 11.2 日志聚合

```yaml
# Loki 配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: loki-config
  namespace: nanobot-admin
data:
  config.yaml: |
    scrape_configs:
    - job_name: nanobot-users
      kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
          - nanobot-users
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_user_id]
        target_label: user_id
        regex: (.+)
        replacement: $1
        action: replace
      - source_labels: [__meta_kubernetes_pod_label_username]
        target_label: username
        regex: (.+)
        replacement: $1
        action: replace
```

### 11.3 日志查询

```bash
# 查看用户日志
kubectl logs -n nanobot-users -l user-id=00001001 --tail=100

# 查看所有用户日志
kubectl logs -n nanobot-users -l app=nanobot --all-containers=true --tail=100

# 实时查看日志
kubectl logs -n nanobot-users -l user-id=00001001 -f
```

---

## 十二、性能优化

### 12.1 资源限制

```yaml
# 单用户资源限制
resources:
  requests:
    cpu: "100m"      # 每个 Pod 请求 100m CPU
    memory: "128Mi"   # 每个 Pod 请求 128MB 内存
  limits:
    cpu: "500m"      # 每个 Pod 限制 500m CPU
    memory: "512Mi"   # 每个 Pod 限制 512MB 内存
```

### 12.2 命名空间配额

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: user-quota
  namespace: nanobot-users
spec:
  hard:
    pods: "5000"               # 每个 namespace 最大 Pod 数
    services: "5000"            # 每个 namespace 最大 Service 数
    configmaps: "5000"          # 每个 namespace 最大 ConfigMap 数
    secrets: "5000"              # 每个 namespace 最大 Secret 数
    persistentvolumeclaims: "5000" # 每个 namespace 最大 PVC 数
    deployments.apps: "5000"    # 每个 namespace 最大 Deployment 数
    requests.cpu: "500"         # 每个 namespace 总 CPU 请求限制
    requests.memory: "640Gi"     # 每个 namespace 总内存请求限制（5000 * 128Mi）
    limits.cpu: "2500"           # 每个 namespace 总 CPU 限制
    limits.memory: "2500Gi"      # 每个 namespace 总内存限制（5000 * 512Mi）
```

### 12.3 水平自动扩缩容（模板）

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nanobot-gateway-hpa-00001001  # 为每个用户创建独立的 HPA
  namespace: nanobot-users
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gateway-dep-00001001  # 替换为实际的 deployment 名称
  minReplicas: 1
  maxReplicas: 3
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**注意**: HPA 需要为每个用户独立创建，建议在用户管理脚本中自动化。

### 12.4 优化建议

| 优化项 | 当前值 | 建议值 | 说明 |
|--------|--------|--------|------|
| 单用户 CPU 请求 | 100m | 50m-100m | 根据实际负载调整 |
| 单用户内存请求 | 128Mi | 64Mi-256Mi | 根据实际使用调整 |
| 单 namespace 最大用户数 | 5000 | 根据资源调整 | 避免单 namespace 过载 |
| 分片策略 | user_id % 1000 | 推荐使用 | 自动平衡负载 |
| 日志轮转 | 默认 | 开启 | 避免日志无限增长 |

---

## 十三、安全设计（P0 优化）

### 13.1 网络策略

**单 namespace 策略：**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: nanobot-network-policy
  namespace: nanobot-users
spec:
  podSelector:
    matchLabels:
      app: nanobot
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 18790
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - protocol: TCP
      port: 53  # DNS
  - to:
    - namespaceSelector: {}  # 允许访问外部 API
```

**多分片策略部署脚本：**

```bash
#!/bin/bash
# deploy-network-policies.sh

# 为所有存在的分片部署网络策略
for shard in $(kubectl get ns -o name | grep -oP 'nanobot-users-\K\d+' | sort -n); do
    kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: nanobot-network-policy
  namespace: nanobot-users-${shard}
spec:
  podSelector:
    matchLabels:
      app: nanobot
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 18790
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - protocol: TCP
      port: 53
  - to:
    - namespaceSelector: {}
EOF
done
```

### 13.2 RBAC 权限（P0 优化）

#### 全局角色（模板）

**注意：** 对于多分片部署，需要为每个分片单独部署 RBAC 资源。

**单 namespace 模板：**

```yaml
# 管理员角色
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: nanobot-admin
  namespace: nanobot-users
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
---
# 只读角色
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: nanobot-reader
  namespace: nanobot-users
rules:
- apiGroups: ["*"]
  resources: ["pods", "services", "configmaps", "secrets", "persistentvolumeclaims"]
  verbs: ["get", "list", "watch"]
```

#### 用户特定角色（动态创建）

**注意**: 用户角色需要为每个用户动态创建，不能使用通用模板。

```bash
#!/bin/bash
# create-user-role.sh - 为特定用户创建 RBAC 角色

create_user_role() {
    local user_id=$1
    local username=$2
    local namespace=$3  # nanobot-users 或分片 namespace

    # 格式化 user_id
    local formatted_id=$(printf "%08d" $user_id)

    # 创建 Role
    kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: nanobot-user-${formatted_id}
  namespace: ${namespace}
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  resourceNames: ["gateway-dep-${formatted_id}"]
  verbs: ["get"]
- apiGroups: ["apps"]
  resources: ["deployments/scale"]
  resourceNames: ["gateway-dep-${formatted_id}"]
  verbs: ["get", "update", "patch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["services"]
  resourceNames: ["gateway-svc-${formatted_id}"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["config-${formatted_id}"]
  verbs: ["get", "update"]
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["secret-${formatted_id}"]
  verbs: ["get", "update"]
- apiGroups: [""]
  resources: ["persistentvolumeclaims"]
  resourceNames: ["pvc-${formatted_id}"]
  verbs: ["get"]
EOF

    # 创建 RoleBinding
    kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: nanobot-user-binding-${formatted_id}
  namespace: ${namespace}
subjects:
- kind: User
  name: ${username}
roleRef:
  kind: Role
  name: nanobot-user-${formatted_id}
  apiGroup: rbac.authorization.k8s.io
EOF
}

# 使用示例
create_user_role 1001 alice nanobot-users
```

#### RBAC 自动化管理

在用户添加时自动创建角色：

```bash
# 在 add-user 命令中调用
add_user() {
    local username=$1
    local user_id=$2

    # ... 其他创建步骤 ...

    # 创建用户特定的 RBAC 角色
    create_user_role $user_id $username $namespace
}
```

### 13.3 Secret 管理

- 敏感信息（API keys）存储在 Kubernetes Secret 中
- 使用 Sealed Secrets 或 External Secrets Operator 加密
- 定期轮换 API keys

---

## 十四、容量规划

### 14.1 资源需求（单 namespace）

| 用户数 | 总 CPU 请求 | 总内存请求 | 总 Pod | 总 Service | 推荐节点数 |
|--------|-------------|-------------|--------|-------------|-------------|
| 100 | 10 cores | 12.8 GB | 100 | 100 | 1-2 |
| 1,000 | 100 cores | 128 GB | 1,000 | 1,000 | 5-10 |
| 5,000 | 500 cores | 640 GB | 5,000 | 5,000 | 25-50 |

**注意**: 单 namespace 建议最大 5,000 用户，超过此数量请使用多分片。

### 14.2 资源需求（多分片）

| 分片数 | 每分片用户数 | 总用户数 | 总 CPU 请求 | 总内存请求 |
|--------|--------------|----------|-------------|-------------|
| 1 | 5,000 | 5,000 | 500 cores |.640 GB |
| 2 | 5,000 | 10,000 | 1,000 cores | 1.28 TB |
| 4 | 5,000 | 20,000 | 2,000 cores | 2.56 TB |

### 14.3 存储需求

| 用户数 | 平均用户数据 | 总存储（含 PVC） |
|--------|--------------|------------------|
| 100 | 10 MB | 100 GB (1Gi per user) |
| 1,000 | 10 MB | 1 TB (1Gi per user) |
| 5,000 | 10 MB | 5 TB (1Gi per user) |
| 10,000 | 10 MB | 10 TB (1Gi per user) |

### 14.4 网络需求

| 指标 | 预估值 |
|------|--------|
| 单用户峰值带宽 | 1 Mbps |
| 10,000 用户峰值带宽 | 10 Gbps |
| 推荐网络配置 | 10 Gbps+ |

---

## 十五、实施步骤

### 阶段 1：环境准备（第 1 周）

```bash
# 1. 创建命名空间（单 namespace 或多分片）
kubectl create namespace nanobot-users
kubectl create namespace nanobot-admin

# 2. 创建 StorageClass（生产环境必需）
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nanobot-storage
provisioner: kubernetes.io/aws-ebs  # 根据环境调整
parameters:
  type: gp3
  encrypted: "true"
  fsType: ext4
allowVolumeExpansion: true
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
EOF

# 3. 构建镜像
eval $(minikube docker-env)
docker build -t nanobot:latest .

# 4. 创建数据目录
mkdir -p /home/k8s/nanobot-data/users

# 5. 初始化注册表
cat > /home/k8s/nanobot-data/registry.json <<'EOF'
{
  "users": {},
  "usernames": {}
}
EOF

# 6. 创建文件锁
touch /home/k8s/nanobot-data/.lock
```

### 阶段 2：部署基础设施（第 1-2 周）

```bash
# 1. 部署 Ingress Controller
kubectl apply -f k8s/templates/ingress-nginx.yaml

# 2. 部署监控
kubectl apply -f k8s/templates/prometheus.yaml
kubectl apply -f k8s/templates/grafana.yaml

# 3. 部署日志聚合
kubectl apply -f k8s/templates/loki.yaml

# 4. 配置网络策略
kubectl apply -f k8s/templates/network-policy.yaml
```

### 阶段 3：部署用户管理工具（第 2-3 周）

```bash
# 1. 部署优化后的 user-manager-v3.sh（包含 P0/P1 优化）
chmod +x k8s/user-manager-v3.sh

# 2. 测试添加用户（使用 8 位格式）
./k8s/user-manager-v3.sh add-user alice 1001
./k8s/user-manager-v3.sh add-user bob 1002

# 3. 验证部署
./k8s/user-manager-v3.sh list-users
./k8s/user-manager-v3.sh status 1001

# 4. 验证 PVC 创建
kubectl get pvc -n nanobot-users -l user-id=00001001
```

### 阶段 4：集成测试（第 3 周）

```bash
# 1. 批量添加测试用户（测试分片功能）
for i in {1..100}; do
  ./k8s/user-manager-v3.sh add-user "testuser_$i" $((2000 + i))
done

# 2. 批量启动
./k8s/user-manager-v3.sh batch-start

# 3. 检查资源使用
kubectl top pods -n nanobot-users
kubectl top nodes

# 4. 测试访问
curl http://alice.nanobot.local

# 5. 测试并发操作（测试文件锁）
./k8s/user-manager-v3.sh add-user test_concurrent 9999 &
./k8s/user-manager-v3.sh add-user test_concurrent2 9998 &
wait
```

### 阶段 5：生产部署（第 4 周）

```bash
# 1. 配置备份
crontab -e
# 添加：0 2 * * * /path/to/backup-users.sh

# 2. 配置一致性检查（每天运行）
echo "0 3 * * * /path/to/consistency-check.sh | mail -s 'Nanobot 一致性检查' admin@example.com" | crontab -

# 3. 配置监控告警
kubectl apply -f k8s/templates/alerting-rules.yaml

# 4. 文档归档
cp k8s/DESIGN_SINGLE_NAMESPACE.md /backup/design-v1.1.md
```

---

## 附录

### A. 模板文件清单

```
k8s/templates/
├── namespace.yaml              # 命名空间模板
├── deployment-single-ns.yaml   # Deployment 模板
├── service-single-ns.yaml      # Service 模板
├── configmap-single-ns.yaml   # ConfigMap 模板
├── secret-single-ns.yaml      # Secret 模板
├── ingress.yaml               # Ingress 模板
├── network-policy.yaml         # 网络策略
├── prometheus.yaml            # Prometheus 配置
├── grafana.yaml              # Grafana 配置
└── loki.yaml                # Loki 配置
```

### B. 常用命令速查

```bash
# 用户管理
./k8s/user-manager-v2.sh add-user <username> <user_id>
./k8s/user-manager-v2.sh remove-user <username>
./k8s/user-manager-v2.sh list-users
./k8s/user-manager-v2.sh start <username|user_id>
./k8s/user-manager-v2.sh stop <username|user_id>
./k8s/user-manager-v2.sh status [username|user_id]

# K8s 操作
kubectl get all -n nanobot-users -l user-id=00001001
kubectl logs -n nanobot-users -l user-id=00001001 -f
kubectl describe pod -n nanobot-users -l user-id=00001001

# 批量操作
kubectl scale deployment -n nanobot-users -l app=nanobot --replicas=0
kubectl scale deployment -n nanobot-users -l app=nanobot --replicas=1
```

### C. 故障排查清单

- [ ] 检查 minikube 是否运行
- [ ] 检查镜像是否存在
- [ ] 检查用户注册表是否有效
- [ ] 检查数据目录权限
- [ ] 检查 Kubernetes 资源状态
- [ ] 检查 Pod 日志
- [ ] 检查资源配额
- [ ] 检查网络策略

---

**文档版本:** 1.4
**最后更新:** 2026-03-04
**维护者:** nanobot team
**状态:** P0（本版）已修复

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.4 | 2026-03-04 | **P0 修复补丁版**：修复 Ingress 正则路由示例（`rewrite-target` 与 `pathType`）、修复 Host/Router 示例 YAML 断裂、修复 ResourceQuota 与容量口径不一致、修复 RBAC 非法授权写法、澄清 Agent 启停需通过 Deployment 滚动更新生效 |
| 1.3 | 2026-03-04 | **修复分片策略资源碎片化问题**：从取模 `user_id % 1000` 改为整数除法 `floor(user_id/5000)`，确保每个 namespace 达到最大容量后再创建新分片 |
| 1.2 | 2026-03-04 | **P0 问题解决**：统一 user_id 为 8 位格式，重构 Ingress 方案为路径路由 + 动态路由服务 |
| 1.1 | 2026-03-04 | P0/P1 优化：存储方案、并发控制、RBAC 模板化、user_id 扩展、分片策略 |
| 1.0 | 2026-03-04 | 初始版本 |

---

## 已解决的 P0 问题

| 问题 | 解决方案 | 章节 |
|------|----------|------|
| Ingress 正则路由示例不可执行 | 修复 `rewrite-target` 为 `/$4`，并将正则路径 `pathType` 改为 `ImplementationSpecific` | [5.1.1 路径路由方案](#511-路径路由方案推荐适用于大规模部署) |
| 路由示例 YAML 存在断裂/语法问题 | 修复 Host 路由注解错误行与缺失字段；修复静态 router 动态段的非法配置 | [5.1.2 Host 路由方案](#512-host-路由方案仅适用于小规模部署-100-用户)、[5.2 内部路由服务](#52-内部路由服务必需) |
| ResourceQuota 与容量规划口径不一致 | 将 `requests.memory` 修正为 `640Gi`，`limits.memory` 修正为 `2500Gi`（按 5000 用户上限） | [12.2 命名空间配额](#122-命名空间配额) |
| RBAC 示例含非法/不可用授权写法 | 使用 `deployments/scale` 子资源授权；移除无效 `resourceNames` 通配写法 | [13.2 RBAC 权限](#132-rbac-权限p0-优化) |
| Agent 动态启停表述不准确 | 明确以 Deployment 模板为准，需滚动更新才能生效 | [5.4 多容器 Deployment 配置示例](#54-多容器-deployment-配置示例) |
