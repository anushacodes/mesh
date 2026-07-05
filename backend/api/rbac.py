""" rbac permission dependencies and helpers """

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from .database.session import get_db
from .database.schema import User, Team, TeamMember, Board
from .security import get_current_active_user


# [teams] verify if the current user is the owner of the team
# (only the team owner is authorized to manage the team)
def verify_team_owner(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Team:
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="team not found"
        )
    
    if team.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="not authorized: you must be the team owner"
        )
    
    return team


# [teams] verify if the current user is a team member or owner
# (team members and the owner are authorized to view and use team resources)
def verify_team_member(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Team:
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="team not found"
        )

    # Check if the user is the owner
    is_owner = team.owner_id == current_user.id

    # Check if the user is a registered member
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()
    
    if not is_owner and not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="not authorized: you must be a team member"
        )
    
    return team


# [boards] verify if the current user has access to a specific board
# (personal boards are owner-only; team boards are accessible to team members, team owner, and board owner)
def verify_board_access(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Board:
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="board not found"
        )

    # 1. Check access for personal boards
    if board.team_id is None:
        if board.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="not authorized to access this personal board"
            )
        return board

    # 2. Check access for team boards
    is_board_owner = board.owner_id == current_user.id
    
    # Retrieve the associated team
    team = db.query(Team).filter(Team.id == board.team_id).first()
    is_team_owner = team and (team.owner_id == current_user.id)

    # Retrieve team membership
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == board.team_id,
        TeamMember.user_id == current_user.id
    ).first()

    if not is_board_owner and not is_team_owner and not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="not authorized to access this team board"
        )

    return board
