
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..database.db_schema import User
from ..schemas.userschema import userIn, userOut

user_router = APIRouter()

# create user endpoint
@user_router.post("/", status_code = 201)
def create_user(user: userIn, db: Session = Depends(get_db)):
    db_user = User(name=user.name, email=user.email, password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": "User created successfully"}   

# get user endpoint
@user_router.get("/{id}", response_model = userOut)
def get_user(id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

# update user endpoint
@user_router.patch("/{id}", status_code = 200)
def update_user(id: int, user: userIn, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.name = user.name
    db_user.email = user.email
    db_user.password = user.password
    
    db.commit()
    return {"message": "User updated successfully"}

# delete user endpoint
@user_router.delete("/{id}", status_code = 204)
def delete_user(id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code = 404, detail = "User not found")
    
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}
