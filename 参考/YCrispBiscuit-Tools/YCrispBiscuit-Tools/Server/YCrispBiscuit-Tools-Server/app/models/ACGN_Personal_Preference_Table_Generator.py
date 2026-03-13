"""
ACGN_Personal_Preference_Table_Generator model for database
数据库中ACGN个人喜好表生成器的 ORM 模型定义
"""


from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

# 创建基础类
Base = declarative_base()

class ACGN_Personal_Preference_Table_Generator(Base):
    __tablename__ = "acgn_personal_preference_table_generator"

    ACGN_Personal_Preference_Table_Generator_ID=Column(Integer,primary_key=True)
    ACGN_Personal_Preference_Table_Generator_Name=Column(String)
    ACGN_Personal_Preference_Table_Generator_Main_Content=Column(String)
    Data_Source_Number=Column(Integer)