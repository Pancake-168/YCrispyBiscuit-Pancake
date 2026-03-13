# Nanobot 单命名空间多用户部署实施手册（P0 修复版）

**版本:** 1.0（对应设计文档 v1.4）  
**日期:** 2026-03-04  
**适用环境:** Kubernetes（开发/测试可 minikube，生产建议托管 K8s）

---

## 1. 目标与范围

本手册用于将“单命名空间多用户部署方案（含 P0 修复）”落地为可执行实施流程，覆盖：

- 环境初始化
- 路由与入口（Ingress + Router）部署
- 用户工作负载模板部署
- 资源配额与 RBAC 落地
- 验收与回滚
- 日常运维操作

> 范围说明：本手册只落实 P0 已修复内容，不扩展 P1/P2 的架构重构。

---

## 2. 前置条件

### 2.1 工具与版本

- `kubectl` >= 1.27
- 已安装并可用的 Ingress Controller（Nginx Ingress）
- 可用 StorageClass（生产）或 `hostPath`（仅开发）
- Shell 工具：`bash`、`jq`、`curl`

### 2.2 集群检查

```bash
kubectl version --short
kubectl get nodes -o wide
kubectl get ns
kubectl get storageclass
```

### 2.3 约定变量

```bash
export NS_USERS="nanobot-users"
export NS_ADMIN="nanobot-admin"
export DATA_ROOT="/home/k8s/nanobot-data"
export REGISTRY_FILE="$DATA_ROOT/registry.json"
export LOCK_FILE="$DATA_ROOT/.lock"
export STORAGE_CLASS="nanobot-storage"
export IMAGE_NANOBOT="nanobot:latest"
```

---

## 3. 实施总览（建议执行顺序）

1. 创建命名空间与基础目录
2. 初始化注册表与锁文件
3. 创建 StorageClass（生产）
4. 部署 Router（动态路由）
5. 部署统一 Ingress（P0 修复规则）
6. 部署用户模板（Deployment/Service/ConfigMap/Secret/PVC）
7. 应用 ResourceQuota（P0 修复值）
8. 应用 RBAC（P0 合法授权）
9. 按验收清单逐项验证
10. 建立回滚与日常运维流程

---

## 4. 阶段 A：基础环境初始化

### 4.1 创建命名空间

```bash
kubectl create namespace "$NS_USERS" || true
kubectl create namespace "$NS_ADMIN" || true
```

### 4.2 初始化宿主数据目录（开发/测试）

```bash
sudo mkdir -p "$DATA_ROOT/users"
sudo touch "$LOCK_FILE"
if [ ! -f "$REGISTRY_FILE" ]; then
  cat <<'EOF' | sudo tee "$REGISTRY_FILE"
{
  "users": {},
  "usernames": {}
}
EOF
fi
```

### 4.3 生产环境 StorageClass（示例）

> 若已存在企业标准 StorageClass，请跳过。

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nanobot-storage
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  encrypted: "true"
  fsType: ext4
allowVolumeExpansion: true
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
```

应用：

```bash
kubectl apply -f storageclass-nanobot.yaml
```

---

## 5. 阶段 B：入口与路由部署（P0 关键）

## 5.1 部署动态 Router（OpenResty + Lua）

### 5.1.1 创建 Lua 脚本 ConfigMap

```yaml
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
    local cache_ttl = 30

    local function load_registry()
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

    function lookup_user_id(username)
      local registry = load_registry()
      if not registry or not registry.usernames then return nil end
      local user_id = registry.usernames[username]
      if user_id then
        return string.format("%08d", tonumber(user_id))
      end
      return nil
    end

    return { lookup_user_id = lookup_user_id }
```

### 5.1.2 创建 Nginx 配置 ConfigMap

```yaml
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

### 5.1.3 部署 Router

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
        configMap:
          name: nginx-router-config
      - name: lua-scripts
        configMap:
          name: router-lua-script
---
apiVersion: v1
kind: Service
metadata:
  name: nanobot-router
  namespace: nanobot-users
spec:
  selector:
    app: nanobot-router
  ports:
  - name: http
    port: 80
    targetPort: 80
```

应用：

```bash
kubectl apply -f router-lua-cm.yaml
kubectl apply -f router-nginx-cm.yaml
kubectl apply -f router-deploy-svc.yaml
kubectl rollout status deploy/nanobot-router -n "$NS_USERS"
```

## 5.2 部署统一 Ingress（P0 修复后的规则）

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nanobot-ingress
  namespace: nanobot-users
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$4
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/use-regex: "true"
spec:
  ingressClassName: nginx
  rules:
  - host: nanobot.local
    http:
      paths:
      - path: /(u|user)/([^/]+)(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: nanobot-router
            port:
              number: 80
```

应用：

```bash
kubectl apply -f ingress-nanobot.yaml
kubectl get ingress -n "$NS_USERS"
```

---

## 6. 阶段 C：用户工作负载模板部署

## 6.1 资源命名规范（必须）

- Deployment: `gateway-dep-{user_id_8位}`
- Service: `gateway-svc-{user_id_8位}`
- ConfigMap: `config-{user_id_8位}`
- Secret: `secret-{user_id_8位}`
- PVC: `pvc-{user_id_8位}`

## 6.2 新增用户标准流程（示例：alice / 1001）

### 6.2.1 生成 8 位 user_id

```bash
USER_ID_RAW=1001
USER_ID=$(printf "%08d" "$USER_ID_RAW")
USERNAME="alice"
echo "$USER_ID"   # 00001001
```

### 6.2.2 创建 PVC

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
  storageClassName: nanobot-storage
```

### 6.2.3 创建 ConfigMap 与 Secret

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: config-00001001
  namespace: nanobot-users
data:
  USER_ID: "00001001"
  USERNAME: "alice"
---
apiVersion: v1
kind: Secret
metadata:
  name: secret-00001001
  namespace: nanobot-users
type: Opaque
stringData:
  API_KEY: "replace-me"
```

### 6.2.4 创建 Deployment（含 Agent）

> P0 约束：Agent 启停以 Deployment 模板为准，修改 `agents.json` 后必须触发滚动更新。

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
      volumes:
      - name: user-data
        persistentVolumeClaim:
          claimName: pvc-00001001
      - name: shared-workspace
        emptyDir: {}
      containers:
      - name: nanobot
        image: nanobot:latest
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
      - name: weather-bot
        image: my-weather-bot:latest
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
```

### 6.2.5 创建 Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: gateway-svc-00001001
  namespace: nanobot-users
  labels:
    app: nanobot
    user-id: "00001001"
    username: "alice"
spec:
  selector:
    app: nanobot
    user-id: "00001001"
  ports:
  - name: gateway
    port: 18790
    targetPort: 18790
```

应用：

```bash
kubectl apply -f user-00001001-pvc.yaml
kubectl apply -f user-00001001-config-secret.yaml
kubectl apply -f user-00001001-deploy.yaml
kubectl apply -f user-00001001-svc.yaml
kubectl rollout status deploy/gateway-dep-00001001 -n "$NS_USERS"
```

---

## 7. 阶段 D：资源配额与权限（P0 关键）

## 7.1 ResourceQuota（修复后的口径）

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: user-quota
  namespace: nanobot-users
spec:
  hard:
    pods: "5000"
    services: "5000"
    configmaps: "5000"
    secrets: "5000"
    persistentvolumeclaims: "5000"
    deployments.apps: "5000"
    requests.cpu: "500"
    requests.memory: "640Gi"
    limits.cpu: "2500"
    limits.memory: "2500Gi"
```

应用：

```bash
kubectl apply -f quota-nanobot-users.yaml
kubectl describe resourcequota user-quota -n "$NS_USERS"
```

## 7.2 RBAC（修复后的合法授权）

### 7.2.1 用户级 Role（示例）

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: nanobot-user-00001001
  namespace: nanobot-users
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  resourceNames: ["gateway-dep-00001001"]
  verbs: ["get"]
- apiGroups: ["apps"]
  resources: ["deployments/scale"]
  resourceNames: ["gateway-dep-00001001"]
  verbs: ["get", "update", "patch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["services"]
  resourceNames: ["gateway-svc-00001001"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["config-00001001"]
  verbs: ["get", "update"]
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["secret-00001001"]
  verbs: ["get", "update"]
- apiGroups: [""]
  resources: ["persistentvolumeclaims"]
  resourceNames: ["pvc-00001001"]
  verbs: ["get"]
```

### 7.2.2 用户级 RoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: nanobot-user-binding-00001001
  namespace: nanobot-users
subjects:
- kind: User
  name: alice
roleRef:
  kind: Role
  name: nanobot-user-00001001
  apiGroup: rbac.authorization.k8s.io
```

应用：

```bash
kubectl apply -f rbac-user-00001001-role.yaml
kubectl apply -f rbac-user-00001001-binding.yaml
kubectl auth can-i get deployments gateway-dep-00001001 -n "$NS_USERS" --as=alice
```

---

## 8. 阶段 E：验收清单（必须逐项通过）

## 8.1 基础健康

```bash
kubectl get pods -n "$NS_USERS"
kubectl get svc -n "$NS_USERS"
kubectl get ingress -n "$NS_USERS"
```

期望：

- `nanobot-router` Pod 全部 `Running`
- 用户 `gateway-dep-*` Pod 为 `Running`
- `nanobot-ingress` 已创建，规则可见

## 8.2 路由验收

```bash
curl -H "Host: nanobot.local" "http://<INGRESS_IP>/u/alice/health"
curl -H "Host: nanobot.local" "http://<INGRESS_IP>/user/00001001/health"
```

期望：

- 返回用户服务健康响应（2xx）
- 不存在路径错位、404（用户名存在时）

## 8.3 配额验收

```bash
kubectl describe resourcequota user-quota -n "$NS_USERS"
```

期望：

- 看到 `requests.memory=640Gi`、`limits.memory=2500Gi`

## 8.4 RBAC 验收

```bash
kubectl auth can-i patch deployments/scale -n "$NS_USERS" --as=alice
kubectl auth can-i get services gateway-svc-00001001 -n "$NS_USERS" --as=alice
```

期望：

- 用户拥有目标服务/目标部署的必要最小权限

## 8.5 Agent 变更生效验收

```bash
kubectl rollout restart deploy/gateway-dep-00001001 -n "$NS_USERS"
kubectl rollout status deploy/gateway-dep-00001001 -n "$NS_USERS"
```

期望：

- 修改 Agent 配置后，只有滚动更新后才生效

---

## 9. 变更与回滚 SOP

## 9.1 Router/Ingress 回滚

```bash
kubectl rollout undo deploy/nanobot-router -n "$NS_USERS"
kubectl describe ingress nanobot-ingress -n "$NS_USERS"
```

若 Ingress 配置误改：

```bash
kubectl apply -f ingress-nanobot-last-known-good.yaml
```

## 9.2 用户工作负载回滚

```bash
kubectl rollout history deploy/gateway-dep-00001001 -n "$NS_USERS"
kubectl rollout undo deploy/gateway-dep-00001001 -n "$NS_USERS"
```

## 9.3 配额与权限回滚

```bash
kubectl apply -f quota-last-known-good.yaml
kubectl apply -f rbac-last-known-good.yaml
```

---

## 10. 日常运维 SOP

## 10.1 新增用户

1. 分配原始 `user_id`
2. 格式化为 8 位
3. 创建 PVC/ConfigMap/Secret/Deployment/Service
4. 更新 registry.json（加锁）
5. 验证路由可达

## 10.2 启停用户

```bash
kubectl scale deploy gateway-dep-00001001 -n "$NS_USERS" --replicas=0
kubectl scale deploy gateway-dep-00001001 -n "$NS_USERS" --replicas=1
```

## 10.3 查看日志

```bash
kubectl logs -n "$NS_USERS" -l user-id=00001001 --all-containers=true --tail=200
```

## 10.4 备份

```bash
tar -czf /backup/nanobot/users-$(date +%Y%m%d).tar.gz /home/k8s/nanobot-data/users
cp /home/k8s/nanobot-data/registry.json /backup/nanobot/registry-$(date +%Y%m%d).json
kubectl get all,cm,secret,pvc -n "$NS_USERS" -o yaml > /backup/nanobot/resources-$(date +%Y%m%d).yaml
```

---

## 11. 常见故障与处理

### 11.1 `/u/{username}` 返回 404

排查：

```bash
kubectl logs -n "$NS_USERS" deploy/nanobot-router --tail=200
kubectl exec -n "$NS_USERS" deploy/nanobot-router -- cat /usr/local/openresty/nginx/conf/registry.json
```

处理：

- 确认 `registry.json` 包含 `usernames -> user_id` 映射
- 确认 user_id 是 8 位格式

### 11.2 Ingress 命中但转发路径错误

排查：

```bash
kubectl describe ingress nanobot-ingress -n "$NS_USERS"
```

处理：

- 确认 `rewrite-target` 为 `/$4`
- 确认路径为 `/(u|user)/([^/]+)(/|$)(.*)` 且 `pathType=ImplementationSpecific`

### 11.3 用户无权扩缩容

排查：

```bash
kubectl auth can-i patch deployments/scale -n "$NS_USERS" --as=<username>
```

处理：

- 确认 Role 中存在 `resources: ["deployments/scale"]`
- 确认 RoleBinding 绑定正确用户名

---

## 12. 交付验收记录模板

```markdown
# Nanobot 单命名空间部署验收记录

- 日期：
- 环境：
- 操作人：

## 验收结果
- [ ] Router 部署成功
- [ ] Ingress 路由成功（/u 与 /user）
- [ ] 用户 00001001 可访问
- [ ] 配额值符合 640Gi/2500Gi
- [ ] RBAC 最小权限通过 can-i 校验
- [ ] Agent 配置变更需滚动更新生效

## 问题与处理
- 问题：
- 处理：
- 结论：
```

---

## 13. 结语

按本手册执行后，可完成 P0 修复版的可运行部署。建议在进入更大规模前，先以 100~500 用户进行分阶段压测与演练，再推进到分片化容量阶段。