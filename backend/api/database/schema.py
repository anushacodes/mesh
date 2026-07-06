from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from .session import Base, engine


class SystemRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


class TeamRole(str, Enum):
    OWNER = "owner"
    MEMBER = "member"


class TaskStatus(str, Enum):
    BACKLOG = "backlog"
    TODO = "todo"
    IN_PROGRESS = "in-progress"
    DONE = "done"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), index=True, nullable=False)
    email = Column(String(80), unique=True, index=True)
    role = Column(SQLAlchemyEnum(SystemRole), default=SystemRole.USER, nullable=False)
    hashed_password = Column(String(100))
    is_active = Column(Boolean, default=True) 

    tasks = relationship("Task", back_populates="owner", foreign_keys="[Task.owner_id]")
    assigned_tasks = relationship("Task", back_populates="assignee", foreign_keys="[Task.assignee_id]")
    teams = relationship("Team", back_populates="owner", cascade="all, delete-orphan")
    boards = relationship("Board", back_populates="owner", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, index=True, nullable=False)  # SHA-256 hash of refresh token
    device_info = Column(String(256), nullable=True)
    ip_address = Column(String(50), nullable=True)
    is_revoked = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="sessions")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    status = Column(SQLAlchemyEnum(TaskStatus), default=TaskStatus.BACKLOG, nullable=False)
    priority = Column(SQLAlchemyEnum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    tags = Column(String(200), nullable=True)  # comma-separated
    due_at = Column(DateTime, nullable=True)  # Task Time Limit
    
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False, index=True)

    owner = relationship("User", back_populates="tasks", foreign_keys=[owner_id])
    assignee = relationship("User", back_populates="assigned_tasks", foreign_keys=[assignee_id])
    board = relationship("Board", back_populates="tasks")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    owner = relationship("User", back_populates="teams")
    boards = relationship("Board", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    __tablename__ = "team_members"

    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role = Column(SQLAlchemyEnum(TeamRole), default=TeamRole.MEMBER, nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())



class Board(Base):
    __tablename__ = "boards"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    owner = relationship("User", back_populates="boards")
    team = relationship("Team", back_populates="boards")
    tasks = relationship("Task", back_populates="board", cascade="all, delete-orphan")


def create_tables():
    Base.metadata.create_all(bind=engine)   