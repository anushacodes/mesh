from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

# CORS middleware

@app.get("/health", status_code=200)
def health_check():
    return {"status": "ok"}


users = {
    1: {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "password": "securepassword"
    }
}

# request body defined by pydantic
class userIn(BaseModel):
    id: int
    name: str
    email: str
    password: str

class userOut(BaseModel):
    name: str
    email: str

# POST /users GET /users/{id}
@app.post("/users", status_code=201)
def create_user(user: userIn):
    users[user.id] = user.model_dump()
    return {"message": "User created successfully"}   

@app.get("/users/{id}", response_model=userOut)
def get_user(id: int):
    if id not in users:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    userData = users.get(id)
    return userData



# POST /projects GET /projects/{id}





# POST /tasks GET /tasks/{id} PATCH /tasks/{id} DELETE /tasks/{id}