from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from .database import Base, engine

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    email = Column(String(80), unique=True, index=True)
    password = Column(String(100))

    # boards = relationship("Board")

    
def create_tables():
    Base.metadata.create_all(bind=engine)   