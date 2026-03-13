# 内置管理系统的概述

项目内置了用于内部维护的管理系统
目前已具备的管理系统：
- nocobase

## 代码架构
鉴于页面风格与主题项目并无太大差别，于是复用主项目的一些存储与UI
### 复用的存储有：
- app.ts
- sidebar.ts
- System.ts
以上存储均将其名称加上"Manager"后缀，以便区分，且将其内部pinia的名称加以改写
### 复用的UI有：
- MainPage页面
- SettingsPage页面
- FunctionList
- PageHeader
- 以上非页面级组件，均在其命名上加上后缀Manager

## 如何拆解与打包
- 上测试环境时直接按readme中说明打包即可
- 上正式环境时将router中的
```
  {
    path: '/system/manager',
    name: 'SystemManager',
    component: () => import('@/views/ManagerSystem/MainPage'),
  },
```
这部分注释掉即可