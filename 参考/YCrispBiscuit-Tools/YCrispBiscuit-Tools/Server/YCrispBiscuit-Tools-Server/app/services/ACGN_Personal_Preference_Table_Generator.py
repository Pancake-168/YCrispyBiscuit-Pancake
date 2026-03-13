from sqlalchemy.orm import Session
from app.repository.ACGN_Personal_Preference_Table_Generator import (
    get_all_ACGN_Personal_Preference_Table_Generator,
    get_ACGN_Personal_Preference_Table_Generator_by_id,
   get_ACGN_Personal_Preference_Table_Generator_by_name,
    create_ACGN_Personal_Preference_Table_Generator,
    update_ACGN_Personal_Preference_Table_Generator,
    delete_ACGN_Personal_Preference_Table_Generator
)

# 查询所有
def list_generators(db: Session):
    return get_all_ACGN_Personal_Preference_Table_Generator(db)

# 依照id查询单个
def get_generator_by_id(db: Session, id: int):
    return get_ACGN_Personal_Preference_Table_Generator_by_id(db, id)

# 依照name查询单个
def get_generator_by_id(db: Session, name: str):
    return get_ACGN_Personal_Preference_Table_Generator_by_name(db, name)

# 新增
def create_generator(db: Session, data: dict):
    # 检查是否提供了主键
    id = data.get("ACGN_Personal_Preference_Table_Generator_ID")
    if not id:
        raise ValueError("未读取到主键ACGN_Personal_Preference_Table_Generator_ID")
    
    # 检查是否已存在对应主键数据
    if get_ACGN_Personal_Preference_Table_Generator_by_id(db, id):
        raise ValueError("主键ACGN_Personal_Preference_Table_Generator_ID已存在，请勿重复")
    return create_ACGN_Personal_Preference_Table_Generator(db, data)

# 更新
def update_generator(db: Session, id: int, name=None, main_content=None, data_source_number=None):
    # 检查是否已存在对应主键数据
    if not get_ACGN_Personal_Preference_Table_Generator_by_id(db, id):
        raise ValueError("未找到ID对应的数据，无法更新")
    return update_ACGN_Personal_Preference_Table_Generator(
        db, id, name, main_content, data_source_number
    )

# 删除
def delete_generator(db: Session, id: int):
    # 检查是否已存在对应主键数据
    if not get_ACGN_Personal_Preference_Table_Generator_by_id(db, id):
        raise ValueError("未找到ID对应的数据，无法删除")
    return delete_ACGN_Personal_Preference_Table_Generator(db, id)