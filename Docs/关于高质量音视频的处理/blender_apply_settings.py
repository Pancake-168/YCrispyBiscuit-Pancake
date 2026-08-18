import bpy

scene = bpy.context.scene
rd = scene.render
img = rd.image_settings
ee = scene.eevee

changes = []

def setval(desc, fn):
    try:
        fn()
        changes.append(f"OK  {desc}")
    except Exception as e:
        changes.append(f"ERR {desc} -> {e}")

# 1. 帧率 24 -> 60（MMD 丝滑感；若你有意 24 可改回）
setval("帧率 24 -> 60", lambda: setattr(rd, "fps", 60))

# 2. 输出格式 PNG -> OpenEXR RGBA Half
setval("输出格式 -> OPEN_EXR", lambda: setattr(img, "file_format", "OPEN_EXR"))
setval("EXR color_mode -> RGBA", lambda: setattr(img, "color_mode", "RGBA"))
setval("EXR color_depth -> 16 (Half)", lambda: setattr(img, "color_depth", "16"))

# 3. 透明底
setval("film_transparent -> True", lambda: setattr(rd, "film_transparent", True))

# 4. GTAO（4.5 的 AO，NPR 黏合感）
setval("use_gtao -> True", lambda: setattr(ee, "use_gtao", True))
setval("gtao_quality 0.25 -> 0.5", lambda: setattr(ee, "gtao_quality", 0.5))
setval("gtao_distance 0.2 -> 0.5", lambda: setattr(ee, "gtao_distance", 0.5))

# 5. 阴影质量（4.5 新体系，保守提升）
setval("shadow_resolution_scale 1.0 -> 2.0", lambda: setattr(ee, "shadow_resolution_scale", 2.0))
setval("shadow_ray_count 1 -> 4", lambda: setattr(ee, "shadow_ray_count", 4))

# 6. 运动模糊质量
setval("motion_blur_steps 1 -> 2", lambda: setattr(ee, "motion_blur_steps", 2))

# 7. 景深采样保持默认（64 已够），DOF 由摄像机控制，不动

print("=== 修改结果 ===")
for c in changes:
    print("  " + c)

# 保存
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print("=== 已保存到:", bpy.data.filepath)
