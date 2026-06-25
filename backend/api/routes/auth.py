# HTTP Requests -> HTTP Responses

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
# from fastapi.security import OAuth2PasswordBearer
# from jose import JWTError, jwt
# from passlib.context import CryptContext    


from ..database.session import get_db
from ..database.schema import User
from ..schemas import UserRegister, UserLogin, UserToken

auth_router = APIRouter()

# request -> validate email -> hash_password() -> save User
@auth_router.post("/register", status_code=201)
def register(user: UserRegister, db: Session = Depends(get_db)):
    pass

# request -> find user -> verify password -> create access token -> return jwt
@auth_router.post("/login", status_code=201)
def login(user: UserLogin, db: Session = Depends(get_db)):
    pass