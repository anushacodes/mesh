
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..database.session import get_db
from ..database.schema import User
from ..schemas import userIn, userOut, userUpdate

user_router = APIRouter()

# create user endpoint
@user_router.post("/", response_model=userOut, status_code = 201, include_in_schema=False)
def create_user(user: userIn, db: Session = Depends(get_db)):
#   users[user.id] = user.model_dump()
#   return {"message": "User created successfully"}  
    db_user = User(name=user.name, email=user.email, hashed_password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


# get user endpoint by id
@user_router.get("/{id}", response_model = userOut)
def get_user(id: int, db: Session = Depends(get_db)):
#     userData = users.get(id)
#     return userData
    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return db_user


# update user endpoint
@user_router.patch("/{id}", response_model=userOut, status_code = 200)
def update_user(id: int, user: userUpdate, db: Session = Depends(get_db)):
#     users[id] = user.model_dump()
#     return {"message": "User updated successfully"}
    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found") 
    if user.name is not None:
        db_user.name = user.name

    if user.email is not None:
        db_user.email = user.email

    if user.password is not None:
        db_user.hashed_password = user.password
    
    db.commit()
    return db_user


# delete user endpoint
@user_router.delete("/{id}", status_code = 204)
def delete_user(id: int, db: Session = Depends(get_db)):
#     del users[id]
#     return {"message": "User deleted successfully"}
    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code = 404, detail = "User not found")
    
    db.delete(db_user)
    db.commit()

    
