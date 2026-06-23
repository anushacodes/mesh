from pydantic import BaseModel, EmailStr

class userIn(BaseModel):
    name: str
    email: EmailStr
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