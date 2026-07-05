""" board routes and controller logic """

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.schema import Board, Team, TeamMember, User
from ..schemas import BoardCreate, BoardUpdate, BoardOut
from ..security import get_current_active_user
from ..rbac import verify_board_access, verify_team_member

board_router = APIRouter()


# [create] create a new board (personal or team-scoped)
@board_router.post("/", response_model=BoardOut, status_code=status.HTTP_201_CREATED)
def create_board(
    board: BoardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify team membership if a team_id is provided
    if board.team_id is not None:
        verify_team_member(board.team_id, db, current_user)
        
    db_board = Board(**board.model_dump(), owner_id=current_user.id)
    db.add(db_board)
    db.commit()
    db.refresh(db_board)
    return db_board


# [read] list all boards the current user has access to
@board_router.get("/", response_model=list[BoardOut])
def get_boards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get all teams the user belongs to (as member)
    member_team_ids = db.query(TeamMember.team_id).filter(TeamMember.user_id == current_user.id).all()
    team_ids = [t[0] for t in member_team_ids]
    
    # Get all teams the user owns
    owned_team_ids = db.query(Team.id).filter(Team.owner_id == current_user.id).all()
    team_ids.extend([t[0] for t in owned_team_ids])

    # Retrieve personal boards owned by the user OR team boards within user's teams
    boards = db.query(Board).filter(
        ((Board.team_id == None) & (Board.owner_id == current_user.id)) |
        (Board.team_id.in_(team_ids))
    ).all()
    
    return boards


# [read] get details of a specific board
@board_router.get("/{board_id}", response_model=BoardOut)
def get_board(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    board: Board = Depends(verify_board_access)
):
    # verify_board_access handles access checking automatically
    return board


# [update] modify a board's details
@board_router.patch("/{board_id}", response_model=BoardOut)
def update_board(
    board_id: int,
    board_data: BoardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    board: Board = Depends(verify_board_access)
):
    # Only board owner or team owner can update
    is_board_owner = board.owner_id == current_user.id
    is_team_owner = False
    if board.team_id is not None:
        team = db.query(Team).filter(Team.id == board.team_id).first()
        is_team_owner = team and (team.owner_id == current_user.id)

    if not is_board_owner and not is_team_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="not authorized to modify this board"
        )
        
    for key, value in board_data.model_dump(exclude_unset=True).items():
        setattr(board, key, value)
        
    db.commit()
    db.refresh(board)
    return board


# [delete] remove a board
@board_router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    board: Board = Depends(verify_board_access)
):
    # Only board owner or team owner can delete
    is_board_owner = board.owner_id == current_user.id
    is_team_owner = False
    if board.team_id is not None:
        team = db.query(Team).filter(Team.id == board.team_id).first()
        is_team_owner = team and (team.owner_id == current_user.id)

    if not is_board_owner and not is_team_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="not authorized to delete this board"
        )
        
    db.delete(board)
    db.commit()
