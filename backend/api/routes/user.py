
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..security import get_current_active_user

from ..database.session import get_db
from ..database.schema import User
from ..schemas import UserOut, UserUpdate

user_router = APIRouter()


# @user_router.post("/", response_model=UserOut, status_code = 201, include_in_schema=False)
# def create_user(user: UserIn, db: Session = Depends(get_db)):

#     """create user endpoint"""

#     db_user = User(name=user.name, email=user.email, hashed_password=user.password, is_active=True)
#     db.add(db_user)
#     db.commit()
#     db.refresh(db_user)

#     return db_user


@user_router.get("/{id}", response_model = UserOut)
def get_user(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):

    """get user endpoint by id"""
    
    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@user_router.patch("/{id}", response_model=UserOut, status_code = 200)
def update_user(id: int, user: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):

    """update user endpoint by id"""

    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found") 
    if user.name is not None:
        db_user.name = user.name

    if user.email is not None:
        db_user.email = str(user.email)  

    if user.password is not None:
        db_user.hashed_password = user.password
    
    db.commit()
    db.refresh(db_user)

    return db_user


@user_router.delete("/{id}", status_code = 204)
def delete_user(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):

    """delete user endpoint by id"""

    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code = 404, detail = "User not found")
    
    db.delete(db_user)
    db.commit()

    
