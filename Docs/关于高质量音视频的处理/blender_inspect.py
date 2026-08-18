import bpy

def safe_get(obj, attr, default="?"):
    try:
        v = getattr(obj, attr)
        if hasattr(v, '__len__') and not isinstance(v, (str, int, float, bool)):
            return f"{v}"
        return v
    except Exception:
        return default

def dump_scene(scene):
    rd = scene.render
    ee = scene.eevee
    print("=" * 50)
    print(f"场景: {scene.name}")
    print("=" * 50)
    print(f"[渲染器] engine = {rd.engine}")
    print(f"[分辨率] {rd.resolution_x} x {rd.resolution_y}  比例 = {rd.resolution_percentage}%")
    print(f"[帧率] fps = {scene.render.fps}  base = {scene.render.fps_base}")
    print(f"[帧范围] {scene.frame_start} - {scene.frame_end}  (step {scene.frame_step})")
    print(f"[输出格式] file_format = {rd.image_settings.file_format}")
    if rd.image_settings.file_format == 'OPEN_EXR':
        print(f"  EXR: exr_codec = {rd.image_settings.exr_codec}  color_mode = {rd.image_settings.color_mode}")
    print(f"[输出路径] {rd.filepath}")
    print(f"[色彩管理] view_transform = {scene.view_settings.view_transform}")
    print(f"[色彩管理] look = {scene.view_settings.look}")
    print(f"[色彩管理] exposure = {scene.view_settings.exposure}  gamma = {scene.view_settings.gamma}")
    print(f"[序列帧] use_file_extension = {rd.use_file_extension}")
    print(f"[透明] film_transparent = {scene.render.film_transparent}")

    if rd.engine == 'BLENDER_EEVEE_NEXT':
        print("--- Eevee Next 设置 ---")
        print(f"  sampling: render_samples = {safe_get(ee,'taa_render_samples')}  viewport_samples = {safe_get(ee,'taa_samples')}")
        print(f"  use_tsr = {safe_get(ee,'use_tsr')}")
        print(f"  shadow: cascade_size = {safe_get(ee,'shadow_cascade_size')}  use_soft_shadows = {safe_get(ee,'use_soft_shadows')}")
        print(f"  contact_shadow = {safe_get(ee,'use_shadow_contact')}")
        print(f"  bloom: use = {safe_get(ee,'use_bloom')}  intensity = {safe_get(ee,'bloom_intensity')}  radius = {safe_get(ee,'bloom_radius')}")
        print(f"  ssao: use = {safe_get(ee,'use_ssao')}  intensity = {safe_get(ee,'ssao_intensity')}  radius = {safe_get(ee,'ssao_radius')}")
        print(f"  dof: use = {safe_get(ee,'use_dof')}")
        print(f"  motion_blur: use = {safe_get(ee,'use_motion_blur')}  shutter = {safe_get(ee,'motion_blur_shutter')}")
        print(f"  volumetric: use = {safe_get(ee,'use_volumetric')}")
        print(f"  gi: use = {safe_get(ee,'use_gi')}  resolution = {safe_get(ee,'gi_resolution')}")
        print(f"  ssr: use = {safe_get(ee,'use_ssr')}")
        print(f"  film: overscan = {safe_get(rd,'overscan_size')}")
        # 列出所有非默认属性名（探索用）
        interesting = [a for a in dir(ee) if not a.startswith('_') and not callable(getattr(ee, a, None))]
        print(f"  [eevee 全部属性] {', '.join(interesting)}")
    elif rd.engine == 'CYCLES':
        print("--- Cycles 设置 ---")
        print(f"  samples: render = {scene.cycles.samples}  preview = {scene.cycles.preview_samples}")
        print(f"  device = {scene.cycles.device}  denoise = {scene.cycles.use_denoising}")
        print(f"  denoiser = {scene.cycles.denoiser}")
        print(f"  max_bounces = {scene.cycles.max_bounces}")

    if scene.camera:
        cam = scene.camera.data
        print(f"[摄像机] {scene.camera.name}  lens = {cam.lens}mm  type = {cam.type}")
        print(f"  dof_use = {cam.dof.use_dof}  fstop = {cam.dof.aperture_fstop}")
    else:
        print("[摄像机] 无")

    if scene.node_tree:
        print(f"[合成节点] 存在 ({len(scene.node_tree.nodes)} 个节点)")
        for n in scene.node_tree.nodes:
            print(f"    - {n.type} {n.name}")
    else:
        print("[合成节点] 无")

for scene in bpy.data.scenes:
    dump_scene(scene)
