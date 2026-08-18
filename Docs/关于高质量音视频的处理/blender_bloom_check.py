import bpy
scene = bpy.context.scene
rd = scene.render
ee = scene.eevee
print("=== RenderSettings 中 bloom/glow/post 相关 ===")
for a in dir(rd):
    if not a.startswith('_') and not callable(getattr(rd, a, None)):
        if any(k in a.lower() for k in ['bloom','glow','post','compositor','filter']):
            print(f"  rd.{a} = {getattr(rd, a)}")
print("=== SceneEEVEE 中 bloom 相关 ===")
for a in dir(ee):
    if not a.startswith('_') and not callable(getattr(ee, a, None)):
        if any(k in a.lower() for k in ['bloom','glow']):
            print(f"  ee.{a} = {getattr(ee, a)}")
print("=== 4.2 时代 bloom 属性是否还在 ===")
for a in ['use_bloom','bloom_intensity','bloom_radius','bloom_threshold','bloom_clamp']:
    try:
        print(f"  {a} = {getattr(ee, a)}")
    except Exception:
        print(f"  {a} = 不存在")
