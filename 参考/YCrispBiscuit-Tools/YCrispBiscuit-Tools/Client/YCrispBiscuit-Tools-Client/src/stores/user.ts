import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserProfile } from '@/types/user'
import request from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  // 用户基本信息
  const profile = ref<UserProfile | null>(null)

  // 用户权限列表
  const permissions = ref<string[]>([])

  // 获取用户信息
  const fetchProfile = async () => {
    try {
      const { data } = await request.get('/user/profile')
      profile.value = data
      permissions.value = data.permissions || []
      return data
    } catch (error) {
      clearUser()
      throw error
    }
  }

  // 清除用户数据
  const clearUser = () => {
    profile.value = null
    permissions.value = []
  }

  // 检查权限
  const hasPermission = (permission: string) => {
    return permissions.value.includes(permission)
  }

  return {
    profile,
    permissions,
    fetchProfile,
    clearUser,
    hasPermission
  }
})