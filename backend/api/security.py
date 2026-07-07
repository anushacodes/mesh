""" auth dependencies and helper functions """

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError

from .schemas import UserRegister, UserToken
from .database.session import get_db
from .database.schema import User

auth_router = APIRouter()


import hashlib
import secrets

SECRET_KEY = "d203ed9aace9b7c13c47d46254a2222f285bad6973762db56d6560188fac3f58" # openssl rand -hex 32
algorithm = "HS256"
# access_token_expire_minutes = 60

pwd_context = CryptContext(schemes = ["bcrypt"], deprecated = "auto")
oauth2scheme = OAuth2PasswordBearer(tokenUrl = "/app/auth/login")


def hash_token(token: str) -> str:
    """Return the SHA-256 hex digest of a string token (prevents raw token leaks)."""
    return hashlib.sha256(token.encode()).hexdigest()


def generate_refresh_token() -> str:
    """Generate a cryptographically secure, URL-safe random string for refresh tokens."""
    return secrets.token_urlsafe(32)



# [registration] user enters password -> hashed -> stored in DB
def hash_password(password: str) -> str:
    return pwd_context.hash(password)



# [login] user enters password -> compared against DB hash -> returns bool
def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)



from datetime import datetime, timedelta
import uuid

# [login] user logs in -> Create JWT -> returns token
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)  # 15 minutes access token lifetime
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4())
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=algorithm)


# [login] receive and decode JWT -> returns user ID 
# (only checks if the token is valid)
def decode_access_token(token: str):
    try:
        token_data = jwt.decode(token, SECRET_KEY, algorithms=[algorithm])
        return token_data
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="invalid token"
        )
    




# [protected routes] call decode_access_token -> get user id -> fetch from db -> return user object
# (uses the decoded token to actually fetch the user)
def get_current_user(token: str = Depends(oauth2scheme), db: Session = Depends(get_db)):
    token_data = decode_access_token(token)
    id = token_data.get("sub")

    if id is None:
        raise HTTPException(
            status_code = 401,
            detail = "invalid token")
    
    user = db.query(User).filter(User.id == id).first()

    if user is None:
            raise HTTPException(
            status_code = 401,
            detail = "user does not exist")
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.is_active is False:
        raise HTTPException(status_code = 401, 
                            detail = "inactive user")
    
    return current_user