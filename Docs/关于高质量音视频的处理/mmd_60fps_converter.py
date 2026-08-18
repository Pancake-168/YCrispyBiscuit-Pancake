# -*- coding: utf-8 -*-
# MMD 60fps 一键转换脚本（路线 A：原生 60fps 渲染）
#
# 用法：
#   1. 导入 VMD 时取消勾选 "Update scene settings"
#   2. 选中导入了动作/相机的对象（骨架 + 相机）
#   3. 在 Blender 的 Scripting 工作区运行本脚本（或 Text Editor 里 Run Script）
#   4. 脚本会把选中对象的所有动作关键帧 X 坐标 ×2、场景 fps 设为 60、帧范围 ×2
#
# 注意：刚体物理（裙摆/头发）如果开了，帧率变化后需要重新调/bake

import bpy

FACTOR = 2.0  # 30fps -> 60fps 用 2；如果从 30 到 120 用 4

def scale_action(action, factor):
    if action is None:
        return False
    for fcurve in action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.co.x *= factor
            kp.handle_left.x *= factor
            kp.handle_right.x *= factor
        fcurve.update()
    return True

def get_actions(obj):
    """收集对象的 action：当前 action + NLA 轨道里的 action"""
    actions = []
    if obj.animation_data:
        if obj.animation_data.action:
            actions.append(obj.animation_data.action)
        for track in obj.animation_data.nla_tracks:
            for strip in track.strips:
                if strip.action:
                    actions.append(strip.action)
    return actions

def main():
    if bpy.context.scene.render.fps != 30:
        print(f"警告：当前场景 fps = {bpy.context.scene.render.fps}，"
              f"不是 30。脚本仍按 ×{FACTOR} 缩放关键帧。")

    processed = set()
    for obj in bpy.context.selected_objects:
        for action in get_actions(obj):
            if action.name in processed:
                continue
            scale_action(action, FACTOR)
            processed.add(action.name)
            print(f"  已缩放动作: {action.name}")

    if not processed:
        print("未找到任何动作！请先选中导入过 VMD 的骨架/相机对象。")
        return

    # 场景 fps 与帧范围
    bpy.context.scene.render.fps = 60
    bpy.context.scene.render.fps_base = 1
    bpy.context.scene.frame_start = int(bpy.context.scene.frame_start * FACTOR)
    bpy.context.scene.frame_end = int(bpy.context.scene.frame_end * FACTOR)
    print(f"  场景 fps -> 60，帧范围 -> {bpy.context.scene.frame_start}~{bpy.context.scene.frame_end}")

    # 刚体缓存提示
    if bpy.context.scene.rigidbody_world is not None:
        print("  提示：场景启用了刚体世界（物理模拟），帧率变化后请重新烘焙物理缓存！")

    print("完成！现在可以 60fps 渲染了。")

if __name__ == "__main__":
    main()
