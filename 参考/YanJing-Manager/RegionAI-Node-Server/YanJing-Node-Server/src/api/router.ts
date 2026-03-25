import { OpenAPIHono } from '@hono/zod-openapi'
import { router as userRouter } from '../controllers/UserController.js'
import { router as healthRouter } from '../controllers/HealthController.js'
import { captchaController } from '../controllers/CaptchaController.js'

const apiRouter = new OpenAPIHono()

// 装配到主 Router (类似 FastAPI 的 router.include_router)
apiRouter.route('/health', healthRouter)
apiRouter.route('/users', userRouter)
apiRouter.route('/captcha', captchaController)

export default apiRouter
