from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.schema import Team, User, TeamMember
from ..schemas import TeamCreate, TeamUpdate, TeamOut, TeamMemberAdd, TeamMemberOut
from ..security import get_current_active_user

team_router = APIRouter()


@team_router.post("/", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def create_team(team: TeamCreate, db: Session = Depends(get_db), 
                current_user: User = Depends(get_current_active_user)):
    """Create a new team. The creator is set as the owner."""
    db_team = Team(**team.model_dump(), owner_id=current_user.id)
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team


@team_router.get("/", response_model=list[TeamOut])
def get_teams(db: Session = Depends(get_db), 
              current_user: User = Depends(get_current_active_user)):
    """List all teams owned by the current user."""
    return db.query(Team).filter(Team.owner_id == current_user.id).all()


@team_router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: int, db: Session = Depends(get_db), 
             current_user: User = Depends(get_current_active_user)):
    """Retrieve details of a specific team (restricted to owner)."""
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    if db_team.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this team")
    return db_team


@team_router.patch("/{team_id}", response_model=TeamOut)
def update_team(team_id: int, team: TeamUpdate, db: Session = Depends(get_db), 
                current_user: User = Depends(get_current_active_user)):
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
def delete_team(team_id: int, db: Session = Depends(get_db), 
                current_user: User = Depends(get_current_active_user)):
    """Delete a team (restricted to owner)."""
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    if db_team.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this team")
    
    db.delete(db_team)
    db.commit()


@team_router.post("/{team_id}/members", response_model=TeamMemberOut, status_code=status.HTTP_201_CREATED)
def add_team_member(team_id: int, member: TeamMemberAdd, db: Session = Depends(get_db), 
                    current_user: User = Depends(get_current_active_user)):
    """Add a user to a team by looking up their email."""
    # Ensure team exists and user owns it
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    if db_team.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to manage this team")

    # Find the target user to add
    user_to_add = db.query(User).filter(User.email == member.email).first()
    if not user_to_add:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User with this email not found")

    # Check if they are already in the team
    existing_membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_to_add.id
    ).first()
    if existing_membership:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member of this team")

    # Create membership
    db_member = TeamMember(team_id=team_id, user_id=user_to_add.id, role="member")
    db.add(db_member)
    db.commit()
    db.refresh(db_member)

    return TeamMemberOut(
        user_id=user_to_add.id,
        name=user_to_add.name,
        email=user_to_add.email,
        role=db_member.role,
        joined_at=db_member.joined_at
    )


@team_router.get("/{team_id}/members", response_model=list[TeamMemberOut])
def get_team_members(team_id: int, db: Session = Depends(get_db), 
                     current_user: User = Depends(get_current_active_user)):
    """List all members of a specific team (restricted to owner)."""
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    if db_team.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to manage this team")

    # Fetch team members joined with user information
    members = db.query(
        User.id.label("user_id"),
        User.name,
        User.email,
        TeamMember.role,
        TeamMember.joined_at
    ).join(TeamMember, TeamMember.user_id == User.id).filter(TeamMember.team_id == team_id).all()

    return members

