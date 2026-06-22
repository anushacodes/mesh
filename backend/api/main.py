from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from backend.api import routes
from backend.api.database.db_schema import create_tables

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(routes.user, prefix="/app/routes/users", tags=["users"])
# app.include_router(routes.board, prefix="/app/routes/board", tags=["board"])

# CORS middleware

@app.get("/health", status_code = 200)
def health():
    return {"status": "running!"}


# users = {
#     1: {
#         "id": 1,
#         "name": "John Doe",
#         "email": "john.doe@example.com",
#         "password": "securepassword"
#     }
# }

# request body defined by pydantic
class userIn(BaseModel):
    id: int
    name: str
    email: str
    password: str

class userOut(BaseModel):
    name: str
    email: str

# create user endpoint
@app.post("/users", status_code = 201)
def create_user(user: userIn):
    users[user.id] = user.model_dump()
    return {"message": "User created successfully"}   

# get user endpoint
@app.get("/users/{id}", response_model = userOut)
def get_user(id: int):
    if id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    userData = users.get(id)
    return userData

# update user endpoint
@app.patch("/users/{id}", status_code = 200)
def update_user(id: int, user: userIn):
    if id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    users[id] = user.model_dump()
    return {"message": "User updated successfully"}

# delete user endpoint
@app.delete("/users/{id}", status_code = 204)
def delete_user(id: int):
    if id not in users:
        raise HTTPException(status_code = 404, detail = "User not found")
    del users[id]
    return {"message": "User deleted successfully"}


# POST /board GET /board/{id}





# POST /tasks GET /tasks/{id} PATCH /tasks/{id} DELETE /tasks/{id}