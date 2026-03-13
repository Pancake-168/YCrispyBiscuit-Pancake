from sqlalchemy.orm import Session
from app.repository.Data_Source_ACGN_Personal_Preference_Table_Generator import (
    get_Data_Source_ACGN_Personal_Preference_Table_Generator_by_ACGN_Personal_Preference_Table_Generator_ID,
    insert_Data_Source_ACGN_Personal_Preference_Table_Generator,
    check_Data_Source_ACGN_Personal_Preference_Table_Generator_Exist,
    insert_Data_Source_ACGN_Personal_Preference_Table_Generator,
    update_Data_Source_ACGN_Personal_Preference_Table_Generator

)


# 查询指定表ID的数据源
def list_data_source_by_generator_id(db: Session, id: int):
    return get_Data_Source_ACGN_Personal_Preference_Table_Generator_by_ACGN_Personal_Preference_Table_Generator_ID(db, id)





# 爬取指定 ACGN 个人喜好表生成器ID的数据源
# 这个方法应该在 service 层实现，负责具体的爬取逻辑
# 逻辑是，前端返回指定的 ACGN 个人喜好表生成器 ID，由controller层接收后，调用 service 层的爬取方法
# 现在实现service 层的爬取方法
# 爬取逻辑：依据ID从对应的官方网站爬取数据源
"""
  这里应该是一个映射：
  ID为————> 对应的官方网站链接
  1————>原神Genshin Impact
  2————>崩坏星穹铁道Honkai: Star Rail
  3————>绝区零ZenlessZoneZero

  暂时就定这三个，后面可能会继续添加

  爬取之后，要将其存入数据库中,此处需要将爬取的数据的对应字段进行提取，将其通过
  insert_Data_Source_ACGN_Personal_Preference_Table_Generator 方法存入数据库

  其中需要注意的是，爬取的网站的数据源中包含图片，此处我暂时不知道怎么处理
  1. 可以将图片存储在本地指定文件夹下面，然后将图片相对路径存入数据库
  2. 可以将图片存储在数据库中，作为BLOB类型存储
  这两个有什么区别呢？
# 1. 存储在本地文件夹中，图片可以直接访问，速度快，但需要额外的存储空间
# 2. 存储在数据库中，图片需要通过程序访问，速度慢
  数据库中的BLOB类型本质上是将二进制数据存储在数据库中，可以直接通过SQL语句访问，但会增加数据库的体积
# 目前我倾向于第一种方式，将图片存储在本地文件夹中，然后将图片相对路径存入数据库
  这样可以减少数据库的体积，同时也可以直接访问图片，速度更快

"""

# 实现爬取指定ID数据源并入库的函数，保留原有注释不变。
def fetch_data_source_by_generator_id(db: Session, id: int) -> dict:
    import requests
    import os

    id_url_map = {
        1: "https://act-api-takumi-static.mihoyo.com/common/blackboard/ys_obc/v1/home/content/list?app_sn=ys_obc&channel_id=25",  # 原神
        2: "https://act-api-takumi-static.mihoyo.com/common/blackboard/sr_wiki/v1/home/content/list?app_sn=sr_wiki&channel_id=17",  # 崩坏星穹铁道
        3: "https://act-api-takumi-static.mihoyo.com/common/blackboard/zzz_wiki/v1/home/content/list?app_sn=zzz_wiki&channel_id=2",  # 绝区零
        4: "https://api.kurobbs.com/wiki/core/catalogue/item/getPage" # 鸣潮
    
    }
    img_dir_map = {
        1: os.path.join("resources/ACGN_Personal_Preference_Table_Generator", "GenshinImpact"),
        2: os.path.join("resources/ACGN_Personal_Preference_Table_Generator", "HonkaiStarRail"),
        3: os.path.join("resources/ACGN_Personal_Preference_Table_Generator", "ZenlessZoneZero"),
        4: os.path.join("resources/ACGN_Personal_Preference_Table_Generator", "WutheringWaves")  
    }
    url = id_url_map.get(id)
    img_dir = img_dir_map.get(id)
    if not url or not img_dir:
        return {"success": False, "msg": f"未知ID: {id}"}

    try:
        if id == 4:
            payload = {
                "catalogueId": 1105,   # 这里填实际需要的参数
                "page": 1,
                "limit": 1000,
            }
            headers = {
                "wiki_type":'9'
            }
            resp = requests.post(url, data=payload,headers=headers,timeout=10)
            print(resp.text)  # 调试用，看返回内容
        else:
            resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        return {"success": False, "msg": f"爬取失败: {str(e)}"}

    char_list = []
    print(f"[DEBUG] 当前ID: {id}")
    if id == 1:
        # 原神：data.list[0].list
        big_list = data.get("data", {}).get("list", [])
        print(f"[DEBUG] 原神 big_list 长度: {len(big_list)}")
        for group in big_list:
            for item in group.get("list", []):
                char_list.append(item)
        print(f"[DEBUG] 原神 char_list 长度: {len(char_list)}")

    elif id == 2:
        # 崩坏星穹铁道：data.list -> 找到name为"游戏图鉴"的children，name为"角色"的list
        big_list = data.get("data", {}).get("list", [])
        print(f"[DEBUG] 崩坏 big_list 长度: {len(big_list)}")
        for group in big_list:
            if group.get("name") == "游戏图鉴":
                for child in group.get("children", []):
                    if child.get("name") == "角色":
                        char_list.extend(child.get("list", []))
        print(f"[DEBUG] 崩坏 char_list 长度: {len(char_list)}")

    elif id == 3:
        # 绝区零：data.list -> 找到name为"游戏图鉴"的children，name为"代理人"的list
        big_list = data.get("data", {}).get("list", [])
        print(f"[DEBUG] 绝区零 big_list 长度: {len(big_list)}")
        for group in big_list:
            if group.get("name") == "游戏图鉴":
                for child in group.get("children", []):
                    if child.get("name") == "代理人":
                        char_list.extend(child.get("list", []))
        print(f"[DEBUG] 绝区零 char_list 长度: {len(char_list)}")

    elif id == 4:
        # 鸣潮: data.results.records
        data_dict = data.get("data")
        print(f"[DEBUG] 鸣潮 data_dict 类型: {type(data_dict)}")
        if data_dict and isinstance(data_dict, dict):
            results = data_dict.get("results")
            print(f"[DEBUG] 鸣潮 results 类型: {type(results)}")
            if results and isinstance(results, dict):
                records = results.get("records", [])
                print(f"[DEBUG] 鸣潮 records 长度: {len(records)}")
                for item in records:
                    char_list.append({
                        "content_id": item.get("id"),
                        "title": item.get("content", {}).get("title"),
                        "icon": item.get("content", {}).get("contentUrl")
                    })
        print(f"[DEBUG] 鸣潮 char_list 长度: {len(char_list)}")
    print(f"[DEBUG] 最终 char_list 长度: {len(char_list)}")

    
    inserted, updated = 0, 0
    os.makedirs(img_dir, exist_ok=True)
    for item in char_list:
        item_id = item.get("content_id")
        item_name = item.get("title")
        img_url = item.get("icon")
        if img_url and item_id:
            img_filename = f"{item_id}.png"
            img_path = os.path.join(img_dir, img_filename)
            try:
                img_resp = requests.get(img_url, timeout=10)
                with open(img_path, "wb") as f:
                    f.write(img_resp.content)
                item_picture = img_path.replace("\\", "/")
            except Exception:
                item_picture = ""
        else:
            item_picture = ""
        if check_Data_Source_ACGN_Personal_Preference_Table_Generator_Exist(db, id, item_id):
            update_Data_Source_ACGN_Personal_Preference_Table_Generator(db, id, item_id, {
                "Item_Picture": item_picture,
                "Item_Name": item_name
            })
            updated += 1
        else:
            insert_Data_Source_ACGN_Personal_Preference_Table_Generator(db, {
                "ACGN_Personal_Preference_Table_Generator_ID": id,
                "Item_Picture": item_picture,
                "Item_Name": item_name,
                "Item_ID": item_id
            })
            inserted += 1
    return {
        "success": True,
        "inserted": inserted,
        "updated": updated,
        "msg": "爬取并入库完成"
    }

