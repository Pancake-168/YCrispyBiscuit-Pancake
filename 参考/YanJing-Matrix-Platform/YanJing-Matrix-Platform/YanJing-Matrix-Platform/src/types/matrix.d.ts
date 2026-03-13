/**
 * 写自2026.1.23，这些字段经过重新编排，真的能被完全用上
 */


export interface MatrixLoginConfig {
  //Matrix服务器地址，例如: https://matrix.org 
  homeserver: string
  // 用户名（不包含@符号和服务器名），例如: myusername
  username: string
  // 用户密码
  password: string
  // 图片验证码 ID
  captchaId?: string
  // 图片验证码文本
  captchaText?: string
}



export interface MatrixRegisterConfig {
  // Matrix服务器地址，例如: https://matrix.org 
  homeserver: string

  // 用户名（不包含@符号和服务器名），例如: myusername
  username: string

  // 用户密码
  password: string

  // 确认密码
  confirmPassword: string
}

export interface MatrixUser {
  // 完整的Matrix用户ID，格式: @username:server.com
  userId: string
  displayName?: string
  avatarUrl?: string
}

// matrix的登录配置简版
export interface MatrixLoginConfigLite {
  homeserver: string
  matrixId: string
  deviceId?: string
}


