"""
ACGN_Personal_Preference_Table_Generator repository for database operations
ACGN个人喜好表相关的数据库操作方法（全部原生SQL写法）
"""

from sqlalchemy.orm import Session
from sqlalchemy import text

# 获取所有ACGN个人喜好表生成器
# 返回类型：list[Row]，每个Row为一条记录
def get_all_ACGN_Personal_Preference_Table_Generator(db: Session) -> list:
    # 构造SQL语句，查询所有记录
    sql = "SELECT * FROM acgn_personal_preference_table_generator"
    result = db.execute(text(sql))  # 执行SQL，返回ResultProxy
    rows = result.fetchall() # 获取所有结果
    # 转换为字典列表
    return [dict(row._mapping) for row in rows]

# 获取指定ID的ACGN个人喜好表生成器
# 返回类型：Row 或 None
def get_ACGN_Personal_Preference_Table_Generator_by_id(db: Session, id: int) -> object:
    # 构造SQL语句，按主键ID查询
    sql = "SELECT * FROM acgn_personal_preference_table_generator WHERE ACGN_Personal_Preference_Table_Generator_ID = :id"
    result = db.execute(text(sql), {"id": id})  # 传入参数字典，防止SQL注入
    return result.fetchone()  # 获取单条结果，找不到返回None

# 获取指定名称的ACGN个人喜好表生成器（模糊查询）
# 返回类型：list[Row]
def get_ACGN_Personal_Preference_Table_Generator_by_name(db: Session, name: str) -> list:
    # 构造SQL语句，模糊查询名称
    sql = "SELECT * FROM acgn_personal_preference_table_generator WHERE ACGN_Personal_Preference_Table_Generator_Name LIKE :name"
    result = db.execute(text(sql), {"name": f"%{name}%"})  # 用LIKE实现模糊匹配
    return result.fetchall()  # 返回所有匹配结果

# 创建新的ACGN个人喜好表生成器
# 返回类型：int（1=成功，0=失败）
def create_ACGN_Personal_Preference_Table_Generator(db: Session, data: dict) -> int:
    # 构造插入SQL，参数一一列出
    sql = """
    INSERT INTO acgn_personal_preference_table_generator
    (ACGN_Personal_Preference_Table_Generator_ID,ACGN_Personal_Preference_Table_Generator_Name, ACGN_Personal_Preference_Table_Generator_Main_Content, Data_Source_Number)
    VALUES (:id,:name, :main_content, :data_source_number)
    """
    result = db.execute(text(sql), {
        "id": data.get("ACGN_Personal_Preference_Table_Generator_ID"),  # 主键ID
        "name": data.get("ACGN_Personal_Preference_Table_Generator_Name"),  # 名称
        "main_content": data.get("ACGN_Personal_Preference_Table_Generator_Main_Content"),  # 主要内容
        "data_source_number": data.get("Data_Source_Number")  # 数据源编号
    })
    db.commit()  # 提交事务
    return 1 if result.rowcount > 0 else 0

# 更新指定ID的ACGN个人喜好表生成器（原生SQL）
# 返回类型：int（1=成功，0=失败）
def update_ACGN_Personal_Preference_Table_Generator(
    db: Session,
    id: int,
    name: str = None,
    main_content: str = None,
    data_source_number: int = None
) -> int:
    # 构造SQL语句，按需拼接set子句
    sql = "UPDATE acgn_personal_preference_table_generator SET "
    params = {"id": id}
    set_list = []
    if name is not None:
        set_list.append("ACGN_Personal_Preference_Table_Generator_Name = :name")
        params["name"] = name
    if main_content is not None:
        set_list.append("ACGN_Personal_Preference_Table_Generator_Main_Content = :main_content")
        params["main_content"] = main_content
    if data_source_number is not None:
        set_list.append("Data_Source_Number = :data_source_number")
        params["data_source_number"] = data_source_number
    if not set_list:
        return 0  # 没有要更新的内容
    sql += ", ".join(set_list)
    sql += " WHERE ACGN_Personal_Preference_Table_Generator_ID = :id"
    result = db.execute(text(sql), params)  # 执行SQL，参数绑定
    db.commit()  # 提交事务
    return 1 if result.rowcount > 0 else 0

# 删除指定ID的ACGN个人喜好表生成器
# 返回类型：int（1=成功，0=失败）
def delete_ACGN_Personal_Preference_Table_Generator(db: Session, id: int) -> int:
    # 构造删除SQL，按主键ID删除
    sql = "DELETE FROM acgn_personal_preference_table_generator WHERE ACGN_Personal_Preference_Table_Generator_ID = :id"
    result = db.execute(text(sql), {"id": id})  # 执行SQL，参数绑定
    db.commit()  # 提交事务
    return 1 if result.rowcount > 0 else 0