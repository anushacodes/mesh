from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .session import Base, engine

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), index=True, nullable=False)
    email = Column(String(80), unique=True, index=True)
    role = Column(String(20), default="user") # make enum later
    hashed_password = Column(String(100))
    is_active = Column(Boolean, default=True) 

    tasks = relationship("Task", back_populates="owner")
    teams = relationship("Team", back_populates="owner", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    status = Column(String(50), default="todo")
    priority = Column(String(50), default="medium")
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    tags = Column(String(200), nullable=True)  # comma-separated
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="tasks")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    owner = relationship("User", back_populates="teams")

    
def create_tables():
    Base.metadata.create_all(bind=engine)   