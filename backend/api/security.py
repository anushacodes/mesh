from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from passlib.context import CryptContext
from passlib.exc import UnknownHashError

# from .schemas import UserRegister, UserToken
from .database.session import get_db
from .database.schema import User

auth_router = APIRouter()

SECRET_KEY = "d203ed9aace9b7c13c47d46254a2222f285bad6973762db56d6560188fac3f58" # openssl rand -hex 32
algorithm = "HS256"
access_token_expire_minutes = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# [registration] user enters password -> hashed -> stored in DB
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# [login] user enters password -> compared against DB hash -> returns bool
def verify_password(password: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(password, hashed)
    except UnknownHashError:
        return password == hashed


# [login] user logs in -> Create JWT -> returns token
def create_access_token(data: dict) -> str:
    return jwt.encode(data, SECRET_KEY, algorithm=algorithm)

# [login] receive and decode JWT -> returns user ID 
# (only checks if the token is valid)
def decode_access_token(token: str):
    pass

# [protected routes] call decode_access_token -> get user id -> fetch from db -> return user object
# (uses the decoded token to actually fetch the user)
def get_current_user():
    pass