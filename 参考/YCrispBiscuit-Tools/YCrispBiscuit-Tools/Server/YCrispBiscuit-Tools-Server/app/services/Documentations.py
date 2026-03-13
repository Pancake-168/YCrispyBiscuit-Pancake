


# -*- coding: utf-8 -*-  # 指定文件编码为utf-8
import os  # 导入os模块，用于文件和目录操作
import json  # 导入json模块，用于读取和解析json文件

# 定义文档根目录路径，指向resources/Documentations文件夹
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOCUMENT_ROOT = os.path.join(PROJECT_ROOT, 'resources', 'Documentations')

# 扫描分区文件夹，返回分区的结构信息
def scan_partition(partition_path):
    partition_name = os.path.basename(partition_path)  # 获取分区文件夹名
    logo_path = os.path.join(partition_path, 'index.png')  # logo图片路径
    info_path = os.path.join(partition_path, 'index.json')  # 分区信息json路径
    info = None  # 初始化分区信息
    if os.path.exists(info_path):  # 如果index.json存在
        with open(info_path, 'r', encoding='utf-8') as f:  # 打开index.json文件
            info = json.load(f)  # 读取并解析json内容
    # 如果logo存在则返回前端可访问的静态资源路径，否则为None
    # 如果logo存在则返回前端可访问的resources路径，否则为None
    logo = f"resources/Documentations/{partition_name}/index.png" if os.path.exists(logo_path) else None
    children = []  # 初始化分区下的子项列表
    for entry in os.listdir(partition_path):  # 遍历分区文件夹下所有内容
        full_path = os.path.join(partition_path, entry)  # 获取完整路径
        if entry in ['index.json', 'index.png']:  # 跳过分区信息和logo文件
            continue  # 跳过本次循环
        if os.path.isdir(full_path):  # 如果是子文件夹
            children.append(scan_folder(full_path))  # 递归扫描子文件夹并添加到children
        elif entry.endswith('.md'):  # 如果是md文件
            children.append({  # 添加md文件信息到children
                'type': 'file',  # 类型为文件
                'name': entry  # 文件名
            })
    return {
        'folder_name': partition_name,  # 分区名
        'logo': logo,  # logo路径
        'info': info,  # 分区信息（index.json内容）
        'children': children  # 分区下的所有子项
    }

# 扫描普通文件夹（非分区），递归返回文件夹结构
def scan_folder(folder_path):
    folder_name = os.path.basename(folder_path)  # 获取文件夹名
    children = []  # 初始化子项列表
    for entry in os.listdir(folder_path):  # 遍历文件夹下所有内容
        full_path = os.path.join(folder_path, entry)  # 获取完整路径
        if os.path.isdir(full_path):  # 如果是子文件夹
            children.append(scan_folder(full_path))  # 递归扫描子文件夹并添加到children
        elif entry.endswith('.md'):  # 如果是md文件
            children.append({  # 添加md文件信息到children
                'type': 'file',  # 类型为文件
                'name': entry  # 文件名
            })
    return {
        'type': 'folder',  # 类型为文件夹
        'folder_name': folder_name,  # 文件夹名
        'children': children  # 文件夹下的所有子项
    }

# 获取所有分区，返回整个文档树状结构
def get_all_Documentations():
    print("DOCUMENT_ROOT:", DOCUMENT_ROOT)    
    print("目录是否存在:", os.path.exists(DOCUMENT_ROOT))
    print("目录内容:", os.listdir(DOCUMENT_ROOT) if os.path.exists(DOCUMENT_ROOT) else "不存在")
    partitions = []  # 初始化分区列表
    if not os.path.exists(DOCUMENT_ROOT):  # 如果文档根目录不存在
        return {'partitions': []}  # 返回空分区列表
    for entry in os.listdir(DOCUMENT_ROOT):  # 遍历根目录下所有内容
        full_path = os.path.join(DOCUMENT_ROOT, entry)  # 获取完整路径
        if os.path.isdir(full_path):  # 如果是分区文件夹
            partitions.append(scan_partition(full_path))  # 扫描分区并添加到分区列表
    return {'partitions': partitions}  # 返回所有分区的树状结构