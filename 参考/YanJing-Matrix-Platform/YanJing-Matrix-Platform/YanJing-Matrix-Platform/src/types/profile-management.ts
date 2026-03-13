export interface MatrixMyProfile {
  userId: string
  displayName: string
  avatarMxcUrl?: string
  avatarHttpUrl?: string
}

export interface UpdateMyProfileOptions {
  displayName?: string
  avatarMxcUrl?: string
  avatarFile?: File
}
