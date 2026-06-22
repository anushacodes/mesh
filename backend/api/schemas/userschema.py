from pydantic import BaseModel, EmailStr

class userIn(BaseModel):
    name: str
    email: str
    password: str

class userOut(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True