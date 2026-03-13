import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  fetchPublicApplications, 
  fetchUserApplications, 
  fetchApplicationAgents,
  publicApplication,
  createAgent,
  destroyAgent,
  handleCreateApplication,
  handleMarketCopyApplication,
  editorAgent,
  searchMarketApplications
} from '@/services/Project/market/market';

import type { ApiApplicationItem, Meta } from '@/types/market';




export const useMarketStore = defineStore('market', () => {
  // --- State ---
  const publicApps = ref<ApiApplicationItem[]>([]);
  const userApps = ref<ApiApplicationItem[]>([]);
  const searchApps = ref<ApiApplicationItem[]>([]);
  
  const publicAppsMeta = ref<Meta>({ count: 0, page: 1, pageSize: 50, totalPage: 0 });
  const userAppsMeta = ref<Meta>({ count: 0, page: 1, pageSize: 50, totalPage: 0 });
  const searchAppsMeta = ref<Meta>({ count: 0, page: 1, pageSize: 50, totalPage: 0 });
  
  // 记录加载状态，避免重复请求
  const isPublicAppsLoaded = ref(false);
  const isUserAppsLoaded = ref(false);

  const isLoading = ref(false);
  const isUserLoading = ref(false);
  const isSearchLoading = ref(false);

  const hasMore = computed(() => {
    // If totalPage is 0, we assume there might be more (initial state) or handled by count
    if (publicAppsMeta.value.totalPage === 0 && publicAppsMeta.value.count === 0) return true;
    return publicAppsMeta.value.page < publicAppsMeta.value.totalPage;
  });

  const hasUserMore = computed(() => {
    if (userAppsMeta.value.totalPage === 0 && userAppsMeta.value.count === 0) return true;
    return userAppsMeta.value.page < userAppsMeta.value.totalPage;
  });

  const hasSearchMore = computed(() => {
    if (searchAppsMeta.value.totalPage === 0 && searchAppsMeta.value.count === 0) return true;
    return searchAppsMeta.value.page < searchAppsMeta.value.totalPage;
  });

  // --- Getters ---
  // 根据 ID (numeric id) 查找应用（自动从两个列表中找）
  const getAppById = computed(() => (id: number | string) => {
    const targetId = Number(id);
    return publicApps.value.find(app => app.id === targetId) ||
      userApps.value.find(app => app.id === targetId);
  });

  // 根据 application_id (string) 查找应用
  const getAppByAppId = computed(() => (appId: string) => {
    return publicApps.value.find(app => app.application_id === appId) ||
      userApps.value.find(app => app.application_id === appId);
  });

  // --- Actions ---

  //bingo 获取公有应用（带缓存策略）
  async function loadPublicApps(page = 1, force = false) {
    // 如果是第一页，且有数据且非强制刷新，直接返回，不再请求
    if (page === 1 && !force && isPublicAppsLoaded.value) return;

    try {
      const { ok, data } = await fetchPublicApplications(page);
      if (ok) {
        const apps = Array.isArray(data) ? data : (data?.data || []);
        if (Array.isArray(apps)) {
          if (page === 1) {
            publicApps.value = apps;
          } else {
            publicApps.value.push(...apps);
          }
          
          isPublicAppsLoaded.value = true;
          if (data?.meta) {
            publicAppsMeta.value = data.meta;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load public apps:', error);
    }
  }

  //bingo 搜索应用
  async function loadSearchApps(name: string, page = 1) {
    try {
      const { ok, data } = await searchMarketApplications(name, page);
      if (ok) {
        const apps = Array.isArray(data) ? data : (data?.data || []);
        if (Array.isArray(apps)) {
          if (page === 1) {
            searchApps.value = apps;
          } else {
            searchApps.value.push(...apps);
          }
          
          if (data?.meta) {
            searchAppsMeta.value = data.meta;
          }
        }
      }
    } catch (error) {
      console.error('Failed to search apps:', error);
    }
  }

  //bingo 获取私有应用
  async function loadUserApps(userId: string, page = 1, force = false) {
    if (page === 1 && !force && isUserAppsLoaded.value) return;
    
    try {
      const { ok, data } = await fetchUserApplications(userId, page);
      if (ok) {
        // 兼容新旧接口格式：如果 data 是数组则直接使用，如果是对象则取 data.data
        const apps = Array.isArray(data) ? data : (data?.data || []);
        if (Array.isArray(apps)) {
          if (page === 1) {
            userApps.value = apps;
          } else {
            userApps.value.push(...apps);
          }
          
          isUserAppsLoaded.value = true;
          if (data?.meta) {
            userAppsMeta.value = data.meta;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user apps:', error);
    }
  } 

  async function getPublicApplications() {
    if (isLoading.value) return;
    if (!hasMore.value && publicApps.value.length > 0) return;

    isLoading.value = true;
    try {
      const page = publicApps.value.length === 0 ? 1 : publicAppsMeta.value.page + 1;
      await loadPublicApps(page, true);
    } finally {
      isLoading.value = false;
    }
  }
  
  async function getUserApplications(userId: string) {
    if (isUserLoading.value) return;
    if (!hasUserMore.value && userApps.value.length > 0) return;

    isUserLoading.value = true;
    try {
      const page = userApps.value.length === 0 ? 1 : userAppsMeta.value.page + 1;
      await loadUserApps(userId, page, true);
    } finally {
      isUserLoading.value = false;
    }
  }

  async function searchApplications(name: string) {
    if (isSearchLoading.value) return;
    
    // New search, reset
    searchApps.value = [];
    searchAppsMeta.value = { count: 0, page: 1, pageSize: 50, totalPage: 0 };
    
    isSearchLoading.value = true;
    try {
      await loadSearchApps(name, 1);
    } finally {
      isSearchLoading.value = false;
    }
  }

  async function getMoreSearchApplications(name: string) {
    if (isSearchLoading.value) return;
    if (!hasSearchMore.value && searchApps.value.length > 0) return;

    isSearchLoading.value = true;
    try {
      const page = searchApps.value.length === 0 ? 1 : searchAppsMeta.value.page + 1;
      await loadSearchApps(name, page);
    } finally {
      isSearchLoading.value = false;
    }
  }
  
  
  
  
  
  // 详情页专用：智能获取应用信息
  // id: 应用的 numeric id
  async function ensureAppDetail(id: number | string, userId: string) {
    const numericId = Number(id);

    // 1. 先尝试从缓存找
    let app = getAppById.value(numericId);

    // 2. 如果没找到（比如用户直接刷新了详情页，Store是空的），则发起请求
    if (!app) {
      // 并行请求，尽可能快。传入 true 强制刷新，防止因已有缓存(但缺该数据)而直接返回
      await Promise.all([loadPublicApps(1, true), loadUserApps(userId, 1, true)]);
      app = getAppById.value(numericId);
    }

    // 3. 如果找到了，检查是否有智能体列表，没有则补全
    if (app) {
      // 注意：这里直接修改 store 中的对象，保持响应性
      // 如果 agentTeams 不存在或者为空数组，尝试获取
      if (!app.agentTeams) {
        try {
          const { ok, data } = await fetchApplicationAgents(String(app.id));
          if (ok && Array.isArray(data)) {
            app.agentTeams = data;
          } else {
            app.agentTeams = []; // 获取失败或为空，置为空数组防止重复获取
          }
        } catch (error) {
          console.error('Failed to load app agents:', error);
          app.agentTeams = []; // 异常也置为空
        }
      }
    }

    return app;
  }




  // 详情页专用：智能获取应用信息 (By AppId)
  async function ensureAppDetailByAppId(appId: string, userId: string) {
    // 1. 先尝试从缓存找
    let app = getAppByAppId.value(appId);

    // 2. 如果没找到，则发起请求
    if (!app) {
      await Promise.all([loadPublicApps(1, true), loadUserApps(userId, 1, true)]);
      app = getAppByAppId.value(appId);
    }

    // 3. 如果找到了，检查是否有智能体列表，没有则补全
    if (app) {
      if (!app.agentTeams) {
        try {
          const { ok, data } = await fetchApplicationAgents(String(app.id));
          if (ok && Array.isArray(data)) {
            app.agentTeams = data;
          } else {
            app.agentTeams = [];
          }
        } catch (error) {
          console.error('Failed to load app agents:', error);
          app.agentTeams = [];
        }
      }
    }

    return app;
  }



  //bingo 更新应用公开状态
  async function updateAppPublicStatus(appId: string, isPublic: boolean) {
    const res = await publicApplication(appId, isPublic);
    if (res.ok) {
      // 更新本地状态
      const app = getAppById.value(appId);
      if (app) {
        app.isPublic = isPublic ? "true" : "false";
        clearPublicApps();
        // 强制刷新第一页，避免先清空导致的列表闪烁
        await loadPublicApps(1, true);
      }
      
    }
    return res;
  }

  //bingo 创建应用
  async function createNewApplication(payload: { displayName: string; author: string }) {
    const res = await handleCreateApplication(payload);
    if (res.ok) {
      // 重新加载用户应用列表
      await loadUserApps(payload.author, 1, true);
    }
    return res;
  }

  //bingo 复制应用
  async function copyApp(payload: { displayName: string; description: string; copy_appid: string; organization_name: string }, userId: string) {
    const res = await handleMarketCopyApplication(payload);
    if (res && res.ok) {
      // 重新加载用户应用列表
      await loadUserApps(userId, 1, true);
    }
    return res;
  }

  //bingo 创建 Agent
  async function createNewAgent(payload: any) {
    const res = await createAgent(payload);
    if (res.ok && !res.data?.error) {
      // 刷新该应用的 Agent 列表
      // 这里比较麻烦，因为我们需要知道是哪个应用。
      // payload.masket_id 应该是应用的 numeric id
      const appId = payload.masket_id;
      const app = getAppById.value(appId);
      if (app) {
        // 强制重新获取该应用的 Agent 列表
        const { ok, data } = await fetchApplicationAgents(String(appId));
        if (ok && Array.isArray(data)) {
          app.agentTeams = data;
        }
      }
    }
    return res;
  }

  //bingo 删除 Agent
  async function deleteAgentAction(agentId: string, appId: string) {
    const res = await destroyAgent({ agent_id: agentId });
    if (res.ok) {
      // 从本地状态移除
      const app = getAppById.value(appId);
      if (app && app.agentTeams) {
        app.agentTeams = app.agentTeams.filter(a => String(a.id) !== String(agentId));
      }
    }
    return res;
  }

  // 编辑 Agent (启动开发后端服务)
  async function editorAgentAction(payload: { appid: string; agentAccount: string; userAccount: string }) {
    const res = await editorAgent(payload);
    return res;
  }

  function clearPublicApps() {
    publicApps.value = [];
    publicAppsMeta.value = { count: 0, page: 1, pageSize: 50, totalPage: 0 };
    isPublicAppsLoaded.value = false;
  }

  function clearUserApps() {
    userApps.value = [];
    userAppsMeta.value = { count: 0, page: 1, pageSize: 50, totalPage: 0 };
    isUserAppsLoaded.value = false;
  }

  // 清空数据（例如退出登录时）
  function clear() {
    clearPublicApps();
    clearUserApps();
  }

  return {
    publicApps,
    userApps,
    publicAppsMeta,
    userAppsMeta,
    isPublicAppsLoaded,
    isUserAppsLoaded,
    isLoading,
    hasMore,
    getPublicApplications,
    loadPublicApps,
    loadUserApps,
    ensureAppDetail,
    ensureAppDetailByAppId,
    getAppById,
    getAppByAppId,
    updateAppPublicStatus,
    createNewApplication,
    copyApp,
    createNewAgent,
    deleteAgentAction,
    editorAgentAction,
    clear,
    clearPublicApps,
    clearUserApps,
    isUserLoading,
    hasUserMore,
    getUserApplications,
    searchApps,
    searchAppsMeta,
    isSearchLoading,
    hasSearchMore,
    searchApplications,
    getMoreSearchApplications
  };
});

