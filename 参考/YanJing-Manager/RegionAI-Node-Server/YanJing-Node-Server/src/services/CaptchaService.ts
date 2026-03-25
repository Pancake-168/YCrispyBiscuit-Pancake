import { ClickCaptcha } from 'click-captcha';
import type { CaptchaResult } from 'click-captcha';
import { LRUCache } from 'lru-cache';
import { v4 as uuidv4 } from 'uuid';
import { BusinessException } from '../exceptions/BusinessException.js';

// 获取 click-captcha 导出的正确坐标结构类型
type VerificationPoints = CaptchaResult['verificationPoints'];

// 配置验证码会话缓存（3分钟过期）
const captchaCache = new LRUCache<string, VerificationPoints>({
  max: 10000, 
  ttl: 1000 * 60 * 3, 
});

// 初始化 ClickCaptcha 实例，可在此做更多自定义如自定义图片、字体等
const captchaInstance = new ClickCaptcha({
  dimensions: {
    width: 400
  },
  characters: {
    count: 4      // 需点击4个字
  },
  effects: {
    noiseLines: 3 // 干扰线数量
  },
  font: {
    fontSize: 40
  }
});

export class CaptchaService {
  /**
   * 生成新的点选验证码
   */
  async generateCaptcha() {
    try {
      // 耗时的图片生成操作
      const { imageBase64, hintBase64, verificationPoints } = await captchaInstance.generate();

      // 构建一个唯一ID
      const captchaId = uuidv4();

      // 将后端答案 data 存入缓存
      captchaCache.set(captchaId, verificationPoints);

      return {
        captchaId,
        image: imageBase64,
        hint: hintBase64,
      };
    } catch (error) {
      throw new BusinessException(500, `无法生成验证码: ${(error as Error).message}`);
    }
  }

  /**
   * 校验用户提交的坐标
   * @param captchaId 验证会话ID
   * @param points 前端传回的顺序点击的 {x, y} 对象数组
   */
  verifyCaptcha(captchaId: string, points: { x: number; y: number }[]): boolean {
    const data = captchaCache.get(captchaId);

    if (!data) {
      throw new BusinessException(400, '验证码已过期或不存在，请刷新重试');
    }

    try {
      // 坑点修复：click-captcha 内部的 verify 实际上期待的是「相对比例的百分比浮点坐标」
      // 因为前端图片可能被缩放，如果不传百分比直接传绝对值，它内部 `pos.x * dimensions.width` 会算错！
      // 若前端传的是原图(默认 400x150) 下的绝对像素，需要我们先手动帮它转换成百分比 (0~1)！
      const width = 400; // 这是我们在 options 配的宽
      const height = 150; // default height is 150
      
      const percentPoints = points.map(p => ({
        x: p.x > 1 ? p.x / width : p.x,   // 如果传大于1当作原始绝对坐标转换，如果是 <1 的小数当作正确百分比
        y: p.y > 1 ? p.y / height : p.y,
      }));

      // 通过组件提供的验证方法比较
      const isValid = captchaInstance.verify(percentPoints, data);

      // 安全最佳实践：无论验证成功与否，只要处理过这个ID，就删除以防止重放攻击
      captchaCache.delete(captchaId);

      return isValid;
    } catch {
      // 当传入格式有误可能报错，也视为失败
      return false;
    }
  }
}

export const captchaService = new CaptchaService();
