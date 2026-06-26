from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database.schema import User
from ..database.session import get_db
from ..security import hash_password, verify_password, create_access_token
from ..schemas import UserLogin, UserRegister, UserToken

auth_router = APIRouter()

# request -> validate email -> hash_password() -> save User
@auth_router.post("/register", status_code=201)
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing_user = (db.query(User).filter(User.email == user.email).first())

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="email already registered"
        )

    db_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
        is_active=True
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user



# request -> find user -> verify password -> create access token -> return jwt
@auth_router.post("/login", status_code=201)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = (db.query(User).filter(User.email == user.email).first())


    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="invalid credentials"
        )

    if not verify_password(user.password, str(db_user.hashed_password)):
        raise HTTPException(
            status_code=401,
            detail="invalid credentials"
        )

    access_token = create_access_token(
        {"sub": str(db_user.id)}
    )

    return UserToken(
        access_token=access_token,
        token_type="bearer"
    )