import dotenv from 'dotenv'

// 根据环境加载不同的配置
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
dotenv.config({ path: envFile })

// 核心配置文件，用于管理环境变量和全局配置
export const config = {
  env: process.env.APP_ENV || 'development',
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  debug: process.env.DEBUG === 'true',
  jwtSecretKey: process.env.JWT_SECRET_KEY || ''
}
