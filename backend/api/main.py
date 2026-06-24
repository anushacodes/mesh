from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.user import user_router
from .auth import auth_router
from .database.db_schema import create_tables

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield

app = FastAPI(lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(user_router, 
                   prefix="/app/user", 
                   tags=["users"])

app.include_router(auth_router,
                   prefix="/app/auth",
                   tags=["auth"])


@app.get("/health", status_code = 200)
def health():
    return {"status": "running!"}
