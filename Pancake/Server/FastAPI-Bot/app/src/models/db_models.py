"""数据库模型 — SQLModel 表定义。"""
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    qq_id: str = Field(default="", max_length=20, unique=True)
    nickname: str = Field(default="", max_length=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Message(SQLModel, table=True):
    __tablename__ = "messages"
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(default="", max_length=50, index=True)
    user_id: str = Field(default="", max_length=20)
    content: str = Field(default="")
    role: str = Field(default="user", max_length=20)  # user / assistant / system
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Memory(SQLModel, table=True):
    __tablename__ = "memories"
    id: Optional[int] = Field(default=None, primary_key=True)
    memory_id: str = Field(default="", max_length=50, unique=True)
    user_id: str = Field(default="", max_length=20)
    content: str = Field(default="")
    memory_type: str = Field(default="fact", max_length=30)  # fact / episode / knowledge
    importance: float = Field(default=0.5)
    access_count: int = Field(default=0)
    last_access_at: Optional[datetime] = None
    decay_factor: float = Field(default=1.0)
    status: str = Field(default="active", max_length=20)  # active / forgotten / archived
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserProfile(SQLModel, table=True):
    __tablename__ = "user_profiles"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(default="", max_length=20, unique=True)
    profile_json: str = Field(default="{}")
    version: int = Field(default=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Episode(SQLModel, table=True):
    __tablename__ = "episodes"
    id: Optional[int] = Field(default=None, primary_key=True)
    episode_id: str = Field(default="", max_length=50, unique=True)
    user_id: str = Field(default="", max_length=20)
    title: str = Field(default="", max_length=500)
    summary: str = Field(default="")
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GraphNode(SQLModel, table=True):
    __tablename__ = "graph_nodes"
    id: Optional[int] = Field(default=None, primary_key=True)
    node_id: str = Field(default="", max_length=50, unique=True)
    name: str = Field(default="", max_length=200)
    node_type: str = Field(default="", max_length=30)  # person / topic / event / concept
    properties: str = Field(default="{}")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GraphEdge(SQLModel, table=True):
    __tablename__ = "graph_edges"
    id: Optional[int] = Field(default=None, primary_key=True)
    source_node_id: str = Field(default="", max_length=50)
    target_node_id: str = Field(default="", max_length=50)
    relation_type: str = Field(default="", max_length=50)  # likes / dislikes / knows
    weight: float = Field(default=1.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
