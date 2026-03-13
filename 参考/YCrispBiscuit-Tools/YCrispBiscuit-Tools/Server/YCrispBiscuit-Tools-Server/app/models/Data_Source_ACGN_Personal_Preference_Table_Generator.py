"""
Data_Source_ACGN_Personal_Preference_Table_Generator model for database
数据库中ACGN个人喜好表生成对应的数据源的 ORM 模型定义
"""


from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

# 创建基础类
Base = declarative_base()

class Data_Source_ACGN_Personal_Preference_Table_Generator(Base):
    __tablename__ = "data_source_acgn_personal_preference_table_generator"

    Data_Source_ACGN_Personal_Preference_Table_Generator_ID=Column(Integer,primary_key=True)
    ACGN_Personal_Preference_Table_Generator_ID=Column(Integer)
    Item_Picture=Column(String)
    Item_Name=Column(String)
    Item_ID=Column(Integer)
    