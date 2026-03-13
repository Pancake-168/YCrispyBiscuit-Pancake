## 第一个方块

---

**1. 打开 Blocks 类**

依旧是右上角打开搜索，搜索“Blocks”，进入以“public class Blocks”为主类的文件中。

在该文件中按住 Ctrl，鼠标光标点击 `register`，进行跳转，锁定注册函数：

```
public static Block register(String id, Block block) {
    return Registry.register(Registries.BLOCK, id, block);
}

https://github.com/user/repo
http://example.com/api/v1
ftp://files.example.com
www.google.com
https://api.openai.com/v1/chat/completions

```

---

**2. 新建 Block 包和 ModBlocks 类** 

新建属于自己的软件包 Block，并新建 Java 类 ModBlocks。

在该类中将上述注册方法进行改写：

```java
public static Block register(String id, Block block) {
    return Registry.register(Registries.BLOCK, Identifier.of(Yes_Neurosama.MOD_ID, id), block);
}
```

---

**3. 注册方块需要两部分：**

- 注册方块
- 注册方块物品

什么意思呢？总的来说，注册物品统一用 Item，但其下会划分不同的种类，你需要把方块这个类进行注册，然后把属于方块类的 Item 用方块类进行注册。

---

**4. 打开 Items 类**

依旧是右上角打开搜索，搜索“Items”，进入以“public class Items”为主类的文件中。

以 stone 石头为例子，按住 Ctrl，鼠标光标点击 `register`，进行跳转，锁定注册函数：

```java
public static Item register(Block block) {
    return register(new BlockItem(block, new Item.Settings()));
}
```

此处可以继续按住 Ctrl，鼠标光标点击 BlockItem，进行跳转，锁定 BlockItem，会发现其继承自 Item。

---

**5. 回到自定义 Block 类，写入注册方法**

```java
public static void registerBlockItems(String id, Block block) {
    Item item = Registry.register(Registries.ITEM, Identifier.of(Yes_Neurosama.MOD_ID, id), new BlockItem(block, new Item.Settings()));
    if (item instanceof BlockItem) {
        ((BlockItem) item).appendBlocks(Item.BLOCK_ITEMS, item);
    }
}
```

并修改之前的 `public static Block register`，将其改写为：

```java
public static Block register(String id, Block block) {
    registerBlockItems(id, block);
    return Registry.register(Registries.BLOCK, Identifier.of(Yes_Neurosama.MOD_ID, id), block);
}
```

---

**6. 注册实体类示例**

```java
public static final Block NeuroPicTestBlock = register("neuropictestblock", new Block(AbstractBlock.Settings.create().strength(3.0f, 3.0f)));
public static final Block NeuroPicTestBlock2 = register("neuropictestblock2", new Block(AbstractBlock.Settings.create().strength(4.5f, 6.0f)));
public static final Block NeuroPicTestBlock3 = register("neuropictestblock3", new Block(AbstractBlock.Settings.create().strength(3.0f, 3.0f)));
```

> 此处在 create 中只定义了 strength，其余的地图显示颜色、音符盒音效、战利品列表等均未写，暂时还没进行到那一步。

---

**7. 注册必不可少的方法**

```java
public static void registerBlocks() {
    Yes_Neurosama.LOGGER.info("Registering Blocks");
}
```

之后在主类中进行调用：

```java
ModBlocks.registerBlocks();
```

---

**8. 添加到自定义模组物品栏**

```java
entries.add(ModBlocks.NeuroPicTestBlock);
entries.add(ModBlocks.NeuroPicTestBlock2);
entries.add(ModBlocks.NeuroPicTestBlock3);
```

---

**9. 中英文名称**

与之前的一样，无非就是将 item 换成 block：

```json
"block.yes_neurosama.neuropictestblock": "neuropictestblock",
"block.yes_neurosama.neuropictestblock2": "neuropictestblock2",
"block.yes_neurosama.neuropictestblock3": "neuropictestblock3"
```

---

**10. 方块状态**

在与 lang、models 同一层级新建 blockstates 目录，下面放 “方块名字.json”。
在 models 和 textures 下面新建 block 目录，放模型与对应的材质，具体的 json 格式参考 minecraft 源代码。

> 掉落物暂时先不急


## 掉落物列表