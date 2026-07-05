from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.schema import Task, User
from ..schemas import TaskCreate, TaskUpdate, TaskOut
from ..security import get_current_active_user
from ..rbac import verify_board_access

task_router = APIRouter()


@task_router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Get a task by ID (validates board access permissions)."""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Verify the user has access to the board this task belongs to
    verify_board_access(db_task.board_id, db, current_user)
    return db_task


@task_router.get("/", response_model=list[TaskOut])
def get_tasks(board_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """List all tasks belonging to a specific board (validates board access)."""
    # Verify access to the board before returning its tasks
    verify_board_access(board_id, db, current_user)
    return db.query(Task).filter(Task.board_id == board_id).all()


@task_router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(task: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Create a task on a specific board (validates write permissions)."""
    # Verify access to the target board before creating the task
    verify_board_access(task.board_id, db, current_user)

    db_task = Task(**task.model_dump(), owner_id=current_user.id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@task_router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, task: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Update task details (validates board access)."""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Verify access to the board this task belongs to
    verify_board_access(db_task.board_id, db, current_user)
    
    for key, value in task.model_dump(exclude_unset=True).items():
        setattr(db_task, key, value)

    db.commit()
    db.refresh(db_task)
    return db_task


@task_router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Delete a task (validates board access)."""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Verify access to the board this task belongs to
    verify_board_access(db_task.board_id, db, current_user)
    
    db.delete(db_task)
    db.commit()