from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt
from passlib.context import CryptContext
from passlib.exc import UnknownHashError

from .schemas import UserRegister, UserToken
from .database.database import get_db
from .database.db_schema import User

auth_router = APIRouter()

SECRET_KEY = "d203ed9aace9b7c13c47d46254a2222f285bad6973762db56d6560188fac3f58" # openssl rand -hex 32
algorithm = "HS256"
access_token_expire_minutes = 60

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2scheme = OAuth2PasswordBearer(tokenUrl="/app/auth/login")

# -- password helpers --
def verfiy_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except UnknownHashError:
        return plain_password == hashed_password

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=algorithm)


# --

@auth_router.post("/register",  status_code=201)
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_user = User(name=user.name, 
                    email=user.email, 
                    hashed_password=get_password_hash(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}

@auth_router.post("/login", response_model=UserToken, status_code=200)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == form_data.username).first()

    if not existing:
        raise HTTPException(status_code=404, detail="user not found")
    
    if not verfiy_password(form_data.password, existing.hashed_password):
        raise HTTPException(status_code=400, detail="incorrect password")

    access_token = create_access_token(data={"sub": existing.email})
    return {"access_token": access_token, "token_type": "bearer"}
