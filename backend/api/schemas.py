from pydantic import BaseModel, ConfigDict


class UserRegister(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserToken(BaseModel):
    access_token: str
    token_type: str


class userIn(BaseModel):
    name: str
    email: str
    password: str


class userOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str


class userUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    password: str | None = None
