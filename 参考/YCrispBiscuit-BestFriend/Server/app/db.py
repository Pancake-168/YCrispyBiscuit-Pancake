from databases import Database
from sqlalchemy import MetaData

from app.core.config import get_settings

# 唯一配置来源：只使用 .env 中的 Settings.database_url，不做任何回退
_settings = get_settings()
DATABASE_URL = _settings.database_url

# 'databases' Database instance for use in async endpoints
database = Database(DATABASE_URL)

# SQLAlchemy metadata (can be imported by models)
metadata = MetaData()

async def connect_db():
    if not database.is_connected:
        await database.connect()

async def disconnect_db():
    if database.is_connected:
        await database.disconnect()
