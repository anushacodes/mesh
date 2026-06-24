
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext    


from ..database.database import get_db
from ..database.db_schema import User
from ..schemas import UserRegister, UserLogin, UserToken

auth_router = APIRouter()

@auth_router.post("/register",  status_code=201)
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_user = User(name=user.name, 
                    email=user.email, 
                    hashed_password=user.password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}

@auth_router.post("/login", status_code=200)
def login(user: UserLogin, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()

    if not existing:
        raise HTTPException(status_code=404, detail="user not found")
    
    if existing.hashed_password != user.password:
        raise HTTPException(status_code=400, detail="incorrect password")

    return {"message": "user logged in successfully"}