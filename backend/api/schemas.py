
# expected input from user

from pydantic import BaseModel, EmailStr

# user schemas
class userIn(BaseModel):
    name: str
    email: EmailStr
    role: str 
    password: str

class userOut(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True

class userUpdate(BaseModel):
    id: int
    name: str | None = None
    email: EmailStr | None = None
    password: str | None = None


# auth schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserToken(BaseModel):
    access_token: str
    token_type: str