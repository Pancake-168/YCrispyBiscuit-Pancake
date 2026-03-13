<template>
  <div class="sso-callback-page">
    <div v-if="loading">正在登录中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAPIClient } from '@nocobase/client';

const route = useRoute();
const router = useRouter();
const api = useAPIClient();

const loading = ref(true);
const error = ref('');

// 您的 Python 后端地址
const PYTHON_SSO_API = 'http://localhost:8000/api/sso/login';

onMounted(async () => {
  // 1. 获取 URL 中的 SSO Token (假设参数名为 sso_token)
  const ssoToken = route.query.sso_token as string;

  if (!ssoToken) {
    error.value = '未找到 SSO Token';
    loading.value = false;
    return;
  }

  try {
    // 2. 调用 Python 后端接口，用 SSO Token 换取 Nocobase Token
    const response = await fetch(PYTHON_SSO_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: ssoToken }),
    });

    if (!response.ok) {
      throw new Error('SSO 登录失败');
    }

    const data = await response.json();
    const nocobaseToken = data.token;

    if (nocobaseToken) {
      // 3. [关键] 将 Token 注入 Nocobase SDK
      // 这会自动将 Token 存入 localStorage 并设置 Authorization Header
      api.auth.setToken(nocobaseToken);

      // 4. 验证 Token 有效性并获取用户信息 (可选，确保 Token 可用)
      await api.auth.check();

      console.log('Nocobase 登录成功');

      // 5. 跳转到 Nocobase 首页或指定页面
      router.push('/admin');
    } else {
      throw new Error('未获取到有效的 Nocobase Token');
    }
  } catch (err: any) {
    console.error(err);
    error.value = err.message || '登录过程中发生错误';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.sso-callback-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
}
.error {
  color: red;
}
</style>
