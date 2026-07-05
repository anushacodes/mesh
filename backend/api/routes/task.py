from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.schema import Task, User
from ..schemas import TaskCreate, TaskUpdate, TaskOut
from ..security import get_current_active_user

task_router = APIRouter()


@task_router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    
    """get task endpoint by id"""

    db_task = db.query(Task).filter(Task.id == task_id).first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    if db_task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return db_task



@task_router.get("/", response_model=list[TaskOut])
def get_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):

    return db.query(Task).filter(Task.owner_id == current_user.id).all()



@task_router.post("/", response_model=TaskOut, status_code=201)
def create_task(task: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):

    """create task endpoint """

    db_task = Task(**task.model_dump(), owner_id=current_user.id)

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    return db_task



@task_router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, task: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):

    """update task endpoint by id"""
    
    db_task = db.query(Task).filter(Task.id == task_id).first()

    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    if db_task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    for key, value in task.model_dump(exclude_unset=True).items():
        setattr(db_task, key, value)

    db.commit()
    db.refresh(db_task)

    return db_task


@task_router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):

    """delete task endpoint by id"""
    
    db_task = db.query(Task).filter(Task.id == task_id).first()

    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    if db_task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(db_task)
    db.commit()