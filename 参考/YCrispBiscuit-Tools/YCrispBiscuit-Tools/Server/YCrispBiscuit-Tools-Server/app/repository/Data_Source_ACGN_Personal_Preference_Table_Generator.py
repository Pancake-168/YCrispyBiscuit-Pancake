"""
Data_Source_ACGN_Personal_Preference_Table_Generator repository for database operations
ACGN个人喜好表对应的数据源相关的数据库操作方法（全部原生SQL写法）
"""

from sqlalchemy.orm import Session
from sqlalchemy import text

# 获取指定表ID的数据源
def get_Data_Source_ACGN_Personal_Preference_Table_Generator_by_ACGN_Personal_Preference_Table_Generator_ID(db: Session, id: int) -> list:
    # 构造SQL语句，按主键ID查询
    sql = "SELECT * FROM data_source_acgn_personal_preference_table_generator WHERE ACGN_Personal_Preference_Table_Generator_ID = :id"
    result = db.execute(text(sql), {"id": id})  # 传入参数字典，防止SQL注入
    rows = result.fetchall() # 获取所有结果
    # 转换为字典列表
    return [dict(row._mapping) for row in rows]




# 插入新的数据源,单条插入
def insert_Data_Source_ACGN_Personal_Preference_Table_Generator(db: Session, data: dict) -> int:
    # 构造插入SQL，参数一一列出
    sql = """
    INSERT INTO data_source_acgn_personal_preference_table_generator
    (
    ACGN_Personal_Preference_Table_Generator_ID,
      Item_Picture,
        Item_Name,
          Item_ID)
    VALUES (:id, :picture, :name, :item_id)
    """
    result = db.execute(text(sql), {
        "id": data.get("ACGN_Personal_Preference_Table_Generator_ID"),  # 生成器ID
        "picture": data.get("Item_Picture"),  # 项目图片
        "name": data.get("Item_Name"),  # 项目名称
        "item_id": data.get("Item_ID")  # 项目ID
    })
    db.commit()  # 提交事务
    return 1 if result.rowcount > 0 else 0


# 依据ACGN_Personal_Preference_Table_Generator_ID和Item_ID查询对应角色是否存在
def check_Data_Source_ACGN_Personal_Preference_Table_Generator_Exist(db: Session, ACGN_Personal_Preference_Table_Generator_ID: int, Item_ID: int) -> bool:
    sql = """
    SELECT COUNT(*) FROM data_source_acgn_personal_preference_table_generator
    WHERE ACGN_Personal_Preference_Table_Generator_ID = :id AND Item_ID = :item_id
    """
    result = db.execute(text(sql), {"id": ACGN_Personal_Preference_Table_Generator_ID, "item_id": Item_ID})
    count = result.scalar()  # 获取计数结果
    return count > 0  # 如果计数大于0，则存在


# 针对某条数据源，依据ACGN_Personal_Preference_Table_Generator_ID和Item_ID进行更新
def update_Data_Source_ACGN_Personal_Preference_Table_Generator(db: Session, ACGN_Personal_Preference_Table_Generator_ID: int, Item_ID: int, data: dict) -> int:
    # 构造更新SQL，参数一一列出
    sql = """
    UPDATE data_source_acgn_personal_preference_table_generator
    SET Item_Picture = :picture, Item_Name = :name
    WHERE ACGN_Personal_Preference_Table_Generator_ID = :id AND Item_ID = :item_id
    """
    result = db.execute(text(sql), {
        "id": ACGN_Personal_Preference_Table_Generator_ID,
        "item_id": Item_ID,
        "picture": data.get("Item_Picture"),
        "name": data.get("Item_Name")
    })
    db.commit()  # 提交事务
    return 1 if result.rowcount > 0 else 0  # 返回受影响的行数是否大于0