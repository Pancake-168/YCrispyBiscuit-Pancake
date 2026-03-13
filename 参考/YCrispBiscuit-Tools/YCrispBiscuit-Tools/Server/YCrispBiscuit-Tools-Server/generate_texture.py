from PIL import Image, ImageDraw, ImageFont
import random
import string

# 定义字符集：数字和字母
chars = string.ascii_letters + string.digits

# 图像尺寸
width = 1000
height = 1000

# 创建图像
img = Image.new('RGBA', (width, height), (0, 0, 0, 0))  # 透明背景
draw = ImageDraw.Draw(img)

# 尝试加载字体，如果失败使用默认
try:
    font = ImageFont.truetype("arial.ttf", 20)
except:
    font = ImageFont.load_default()

# 字符大小
char_width = 20
char_height = 20

# 计算每行每列的字符数
cols = width // char_width
rows = height // char_height

# 随机生成字符阵列
for row in range(rows):
    for col in range(cols):
        char = random.choice(chars)
        x = col * char_width
        y = row * char_height
        # 获取字符的边界框以计算居中位置
        bbox = draw.textbbox((0, 0), char, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        # 居中位置
        x_center = x + (char_width - text_width) / 2
        y_center = y + (char_height - text_height) / 2
        # 统一颜色：绿色
        color = (0, 255, 0, 255)
        draw.text((x_center, y_center), char, fill=color, font=font)

# 保存图像
img.save('random_chars_texture.png')
print("贴图已生成：random_chars_texture.png")
