from PIL import Image, ImageDraw, ImageFont
import random
import os
import string

# 定义字符集：数字 + 大写字母
chars = string.digits + string.ascii_uppercase

# 生成数量
variant_count = 6

# 图像尺寸（保持正方形）
size = 130
width = size
height = size

# 尝试加载字体，如果失败使用默认
try:
    font = ImageFont.truetype("arial.ttf", 20)
except:
    font = ImageFont.load_default()

# 字符大小
char_width = 20
char_height = 20

# 计算行数
rows = height // char_height

def draw_char_column(draw_obj: ImageDraw.ImageDraw):
    """绘制随机字符列。"""
    for row in range(rows):
        char = random.choice(chars)
        y = row * char_height
        bbox = draw_obj.textbbox((0, 0), char, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x_center = (width - text_width) / 2
        y_center = y + (char_height - text_height) / 2
        color = (0, 255, 0, 255)
        draw_obj.text((x_center, y_center), char, fill=color, font=font)


output_path = r'resources\pic\generated\code_rain_column_0.png'
root, ext = os.path.splitext(output_path)

for index in range(variant_count):
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_char_column(draw)

    if index == 0:
        save_path = output_path
    elif "_0" in output_path:
        save_path = output_path.replace("_0", f"_{index}")
    else:
        save_path = f"{root}_{index}{ext}"

    img.save(save_path)
    print(f"贴图已生成：{save_path}")
