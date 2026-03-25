import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { Result } from '../utils/Result.js';
import { captchaService } from '../services/CaptchaService.js';
import {
  GetCaptchaResponseSchema,
  VerifyCaptchaRequestSchema,
  VerifyCaptchaResponseSchema
} from '../schemas/CaptchaSchema.js';

export const captchaController = new OpenAPIHono();

/**
 * [Route] 获取点选验证码
 */
const getCaptchaRoute = createRoute({
  method: 'get',
  path: '/generate',
  tags: ['Captcha'],
  summary: '获取点选验证码',
  description: '生成一张由4个随机中文字符组成的验证码底图以及对应的提示。',
  responses: {
    200: {
      content: { 'application/json': { schema: GetCaptchaResponseSchema } },
      description: '生成验证码成功'
    }
  }
});

captchaController.openapi(getCaptchaRoute, async (c) => {
  const resultData = await captchaService.generateCaptcha();
  return c.json(Result.success(resultData));
});

/**
 * [Route] 验证点选验证码
 */
const verifyCaptchaRoute = createRoute({
  method: 'post',
  path: '/verify',
  tags: ['Captcha'],
  summary: '校验点选验证码',
  description: '根据前端返回的点击坐标数组判断点击顺序和区域是否正确。',
  request: {
    body: {
      content: { 'application/json': { schema: VerifyCaptchaRequestSchema } }
    }
  },
  responses: {
    200: {
      content: { 'application/json': { schema: VerifyCaptchaResponseSchema } },
      description: '校验验证码结果'
    }
  }
});

captchaController.openapi(verifyCaptchaRoute, async (c) => {
  const { captchaId, points } = c.req.valid('json');

  const isValid = captchaService.verifyCaptcha(captchaId, points);

  if (!isValid) {
    return c.json(Result.error('验证码校验失败或排序不正确', 200, { success: false })); // 或者 400
  }

  return c.json(Result.success({ success: true, message: '验证通过' }));
});
