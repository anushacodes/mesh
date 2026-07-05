
"""
Pydantic defines structure of expected input/output.
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr
from .database.schema import SystemRole, TeamRole, TaskStatus, TaskPriority

# shared user fields
class UserBase(BaseModel):
    name: str
    email: EmailStr

# authentication
class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserToken(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: str | None = None

class UserSessionOut(BaseModel):
    id: int
    device_info: str | None = None
    ip_address: str | None = None
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


# user responses
class UserOut(UserBase):
    id: int
    role: SystemRole
    is_active: bool

    class Config:
        from_attributes = True


# user update
class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    role: SystemRole | None = None


# task schemas
class TaskBase(BaseModel):
    title: str
    description: str | None = None
    status: TaskStatus | None = TaskStatus.TODO
    priority: TaskPriority | None = TaskPriority.MEDIUM
    start_date: str | None = None
    end_date: str | None = None
    tags: str | None = None  # comma-separated
    assignee_id: int | None = None

class TaskCreate(TaskBase):
    board_id: int

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    start_date: str | None = None
    end_date: str | None = None
    tags: str | None = None
    assignee_id: int | None = None
    board_id: int | None = None

class TaskOut(TaskBase):
    id: int
    owner_id: int
    board_id: int

    class Config:
        from_attributes = True



# team schemas
class TeamBase(BaseModel):
    name: str
    description: str | None = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

class TeamOut(TeamBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# team member schemas
class TeamMemberAdd(BaseModel):
    email: EmailStr

class TeamMemberOut(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    role: TeamRole
    joined_at: datetime

    class Config:
        from_attributes = True


# board schemas
class BoardBase(BaseModel):
    name: str
    description: str | None = None
    team_id: int | None = None

class BoardCreate(BoardBase):
    pass

class BoardUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

class BoardOut(BoardBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True



