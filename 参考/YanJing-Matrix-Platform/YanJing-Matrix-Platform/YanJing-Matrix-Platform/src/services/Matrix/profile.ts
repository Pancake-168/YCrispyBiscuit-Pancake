import { matrixClient } from '@/services/Matrix/client'
import type { MatrixClient } from 'matrix-js-sdk'
import type { MatrixMyProfile, UpdateMyProfileOptions } from '@/types/profile-management'

class MatrixProfileService {
  private getClientOrThrow(): MatrixClient {
    const client = matrixClient.getAuthedClient()
    if (!client) {
      throw new Error('Matrix 客户端不可用，请先登录')
    }
    return client
  }

  private getCurrentUserIdOrThrow(client: MatrixClient): string {
    const userId = client.getUserId?.() || ''
    if (!userId) {
      throw new Error('无法获取当前用户 ID')
    }
    return userId
  }

  async getMyProfile(): Promise<MatrixMyProfile> {
    const client = this.getClientOrThrow()
    const userId = this.getCurrentUserIdOrThrow(client)

    const profileInfo = await client.getProfileInfo(userId)
    const avatarMxcUrl = profileInfo?.avatar_url || undefined
    const avatarHttpUrl = avatarMxcUrl
      ? client.mxcUrlToHttp(avatarMxcUrl, 128, 128, 'crop', false, false) || undefined
      : undefined

    return {
      userId,
      displayName: profileInfo?.displayname || userId,
      avatarMxcUrl,
      avatarHttpUrl,
    }
  }

  async updateDisplayName(displayName: string): Promise<void> {
    const client = this.getClientOrThrow()
    const finalDisplayName = displayName.trim()
    if (!finalDisplayName) {
      throw new Error('昵称不能为空')
    }
    await client.setDisplayName(finalDisplayName)
  }

  async uploadAvatarFile(file: File): Promise<string> {
    const client = this.getClientOrThrow()
    const uploadRes = await client.uploadContent(file, {
      type: file.type,
      name: file.name,
    })

    const contentUri = uploadRes?.content_uri
    if (!contentUri) {
      throw new Error('头像上传成功但未返回 content_uri')
    }
    return contentUri
  }

  async updateAvatar(avatarMxcUrl: string): Promise<void> {
    const client = this.getClientOrThrow()
    if (!avatarMxcUrl.trim()) {
      throw new Error('头像地址不能为空')
    }
    await client.setAvatarUrl(avatarMxcUrl.trim())
  }

  async updateMyProfile(options: UpdateMyProfileOptions): Promise<MatrixMyProfile> {
    const displayName = options.displayName?.trim()
    if (typeof displayName === 'string' && displayName.length > 0) {
      await this.updateDisplayName(displayName)
    }

    if (options.avatarFile) {
      const mxcUrl = await this.uploadAvatarFile(options.avatarFile)
      await this.updateAvatar(mxcUrl)
    } else if (typeof options.avatarMxcUrl === 'string' && options.avatarMxcUrl.trim()) {
      await this.updateAvatar(options.avatarMxcUrl)
    }

    return this.getMyProfile()
  }
}

export const matrixProfileService = new MatrixProfileService()
