from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from .database import Base, engine

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), index=True, nullable=False)
    email = Column(String(80), unique=True, index=True)
    hashed_password = Column(String(100))

    # boards = relationship("Board")

    
def create_tables():
    Base.metadata.create_all(bind=engine)   