import { z } from '@hono/zod-openapi';
import { createResultSchema } from '../utils/Result.js';

export const GetCaptchaResponseSchema = createResultSchema(
  z.object({
    captchaId: z.string().openapi({ description: '验证码会话唯一ID' }),
    image: z.string().openapi({ description: '验证码图片的 Base64 数据 (含 data:image/png;base64,...)' }),
    hint: z.string().openapi({ description: '前端提示用户的内容，比如 SVG 数据或文字指引' }),
  })
);

export const VerifyCaptchaRequestSchema = z.object({
  captchaId: z.string().openapi({ description: '验证码会话唯一ID' }),
  points: z.array(
    z.object({
      x: z.number().openapi({ description: '点击的 x 坐标' }),
      y: z.number().openapi({ description: '点击的 y 坐标' })
    })
  ).openapi({ description: '用户点击的坐标点列表，按顺序排列' })
}).openapi('VerifyCaptchaRequest');

export const VerifyCaptchaResponseSchema = createResultSchema(
  z.object({
    success: z.boolean().openapi({ description: '验证结果，true 为成功' }),
    message: z.string().optional().openapi({ description: '附加验证信息' })
  })
);
