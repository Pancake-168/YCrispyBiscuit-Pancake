from databases import Database
from sqlalchemy import MetaData

from app.core.config import get_settings

_settings = get_settings()
DATABASE_URL = _settings.database_url


database = Database(DATABASE_URL)

metadata = MetaData()

async def connect_db():
    if not database.is_connected:
        await database.connect()

async def disconnect_db():
    if database.is_connected:
        await database.disconnect()
