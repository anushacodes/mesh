from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.schema import Team, User
from ..schemas import TeamCreate, TeamUpdate, TeamOut
from ..security import get_current_active_user

team_router = APIRouter()


@team_router.post("/", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def create_team(team: TeamCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Create a new team. The creator is set as the owner."""
    db_team = Team(**team.model_dump(), owner_id=current_user.id)
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team


@team_router.get("/", response_model=list[TeamOut])
def get_teams(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """List all teams owned by the current user."""
    return db.query(Team).filter(Team.owner_id == current_user.id).all()


@team_router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Retrieve details of a specific team (restricted to owner)."""
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    if db_team.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this team")
    return db_team


@team_router.patch("/{team_id}", response_model=TeamOut)
def update_team(team_id: int, team: TeamUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Update team details (restricted to owner)."""
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    if db_team.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this team")
    
    for key, value in team.model_dump(exclude_unset=True).items():
        setattr(db_team, key, value)
        
    db.commit()
    db.refresh(db_team)
    return db_team


@team_router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Delete a team (restricted to owner)."""
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    if db_team.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this team")
    
    db.delete(db_team)
    db.commit()
