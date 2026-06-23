from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..schemas.authschema import UserRegister, UserLogin, UserToken
from ..database.database import get_db
from ..database.db_schema import User

auth_router = APIRouter()

@auth_router.post("/login", status_code=200)
def login(user: UserLogin, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()

    if not existing:
        raise HTTPException(status_code=404, detail="user not found")
    
    if existing.hashed_password != user.password:
        raise HTTPException(status_code=400, detail="incorrect password")

    return {"message": "user logged in successfully"}


@auth_router.post("/register",  status_code=201)
def register(user: UserRegister, db: Session = Depends(get_db)):
    # check is email exists in db
    existing = db.query(User).filter(User.email == user.email).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_user = User(name=user.name, email=user.email, hashed_password=user.password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}