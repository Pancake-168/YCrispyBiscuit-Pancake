import bpy

scene = bpy.context.scene
rd = scene.render
ee = scene.eevee

print("=== 查找 TSR / upscale 相关属性 ===")
for obj_name, obj in [("RenderSettings(rd)", rd), ("SceneEEVEE(ee)", ee)]:
    for a in dir(obj):
        if not a.startswith('_') and not callable(getattr(obj, a, None)):
            al = a.lower()
            if any(k in al for k in ['tsr', 'upscal', 'super', 'reproject']):
                try:
                    print(f"  {obj_name}.{a} = {getattr(obj, a)}")
                except Exception as e:
                    print(f"  {obj_name}.{a} = <err {e}>")

print()
print("=== 4.5 Eevee 关键属性实测 ===")
checks = [
    ("use_shadows", ee), ("shadow_resolution_scale", ee), ("shadow_pool_size", ee),
    ("shadow_ray_count", ee), ("shadow_step_count", ee), ("use_shadow_jitter_viewport", ee),
    ("use_gtao", ee), ("gtao_distance", ee), ("gtao_quality", ee),
    ("use_raytracing", ee), ("ray_tracing_method", ee),
    ("motion_blur_max", ee), ("motion_blur_steps", ee),
    ("bokeh_max_size", ee), ("use_bokeh_jittered", ee),
    ("volumetric_samples", ee), ("use_fast_gi", ee), ("fast_gi_resolution", ee),
    ("film_transparent", rd), ("use_file_extension", rd),
    ("fps", rd), ("resolution_percentage", rd),
]
for attr, obj in checks:
    try:
        print(f"  {attr} = {getattr(obj, attr)}")
    except Exception as e:
        print(f"  {attr} = <err>")

print()
print("=== 输出面板 image_settings 相关 ===")
img = rd.image_settings
for a in ['file_format', 'color_mode', 'color_depth', 'exr_codec', 'compression', 'use_zbuffer']:
    try:
        print(f"  image_settings.{a} = {getattr(img, a)}")
    except Exception as e:
        print(f"  image_settings.{a} = <err>")
