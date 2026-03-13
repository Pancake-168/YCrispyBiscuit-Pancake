# 从零开始的 1.21 模组开发

---

## 1. 模组开发环境搭建

### 1.0 Java 环境

- **需求**：我的世界 1.21 版本为 Java 21

### 1.1 开发软件

- **需求**：IntelliJ IDEA（推荐，其实 VSCode 也行）
- 中文汉化插件等可选

### 1.2 下载 Fabric API

- 下载 Fabric API：[下载地址](https://fabricmc.net/develop/template/)
- 填写 **Mod Name**：`YesNeurosama`
- 填写 **Package Name**：`com.ycb.yesneurosama`
- 选择 **Minecraft Version**：`1.21`
- 选项勾选：
  - [√] Data Generation（数据生成）
  - [ ] 其余不要选

> 💡 **Tips**：Split client and common sources 为拆分客户端和服务端代码，一般开发 mod 都是为服务端开发，所以区别不大。

- 点击下载 **Download Template（.zip）**

### 1.3 导入 IntelliJ IDEA

1. 将压缩包解压，打开 IntelliJ IDEA
2. 点击 `File -> Open`，选择刚刚解压的文件夹
3. 系统会自动进行 Gradle 的构建（建议开加速器，或使用国内镜像源）

> ⚠️ 构建成功后会有一个警告：
> 
> `Cannot resolve resource filtering of MatchingCopyAction. IDEA may fail to build project. Consider using delegated build (enabled by default).`
> 
> 一般没什么影响

### 1.4 获取源码资源

- 在 IDEA 侧边栏的 Gradle 大象图标里，点击 `Tasks` 目录
- 点击 `fabric` 目录，找到 `genSources`，双击运行

### 1.5 修改项目内 JDK 版本

- 在 `build.gradle` 文件中，可以看到：

  ```groovy
  sourceCompatibility = JavaVersion.VERSION_21  
  targetCompatibility = JavaVersion.VERSION_21
  ```

- 项目结构需要设置 JDK 为 java21
- 设置中的“构建执行部署”中的“构建工具”下的 Gradle JVM 也需要为 java21

### 1.6 基本信息改写

- 在 `resources/fabric.mod.json` 文件中，记录了 mod 的基本信息，包括但不限于 description、version、id、authors 等，可自行修改。

- 需要注意的是，在：

  ```json
  "entrypoints": {
      "main": [
          "com.ycb.yesneurosama.YesNeurosama"
      ],
      "fabric-datagen": [
          "com.ycb.yesneurosama.YesNeurosamaDataGenerator"
      ]
  },
  ```

  需要添加一项新的字段 `client`，用于存放客户端代码，修改后如下：

  ```json
  "entrypoints": {
      "main": [
          "com.ycb.yesneurosama.YesNeurosama"
      ],
      "fabric-datagen": [
          "com.ycb.yesneurosama.YesNeurosamaDataGenerator"
      ],
      "client": [
          "com.ycb.yesneurosama.YesNeurosamaClient"
      ]
  },
  ```

- 对应地，需要在 `src/main/java/com/ycb/yesneurosama` 目录下新建 `YesNeurosamaClient.java` 文件，内容如下：

  ```java
  package com.ycb.yesneurosama;

  import net.fabricmc.api.ClientModInitializer;

  public class YesNeurosamaClient implements ClientModInitializer {
      @Override
      public void onInitializeClient() {
          
      }
  }
  ```

### 1.7 其他信息修改

- 在 `gradle.properties` 内可修改 mod 的版本号，例如：
  
  ```properties
  mod_version=1.21—1.0.0
  ```
  作为 Minecraft 1.21 的第一个版本
- 每次修改完 `gradle.properties` 后，页面会出现大象图标，点击它选择刷新重构项目即可

### 1.8 源码查看

- 针对 Minecraft 的源码，之前已 `genSources`，可在外部库中找到源码
- 为方便跳转，可在 `com/ycb/yesneurosama/mixin/ExampleMixin.java` 文件内的 `MinecraftServer` 上 `Ctrl+左键` 跳转
- 若未直接跳转到源码，可选择下载源码，成功后应能看到注释
- 后续查询源码类可用 IDEA 搜索功能

> 💡 **Tips**：推荐使用 IDEA，可直接查看外部库代码，VSCode 可能不支持

### 1.9 启动测试

- 选择右上角启动方式中的 `Minecraft Client` 启动
- 若能正常启动游戏，则环境搭建成功！

---

## 2. 编写第一个物品

---

## 3. 编写第一个方块

