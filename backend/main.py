from fastapi import FastAPI

app = FastAPI()

# app.include_router(users.router)
# app.include_router(projects.router)
# app.include_router(tasks.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
