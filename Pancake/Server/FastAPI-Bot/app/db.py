"""数据库连通性检查，启动/关闭时调用。"""
from app.core.database import engine


def connect_db():
    """验证数据库连通性。"""
    with engine.connect() as conn:
        conn.execute("SELECT 1")


def disconnect_db():
    """释放引擎连接池。"""
    engine.dispose()
