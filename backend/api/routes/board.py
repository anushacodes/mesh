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
    # TODO: Fill in the logic.
    # 1. If board.team_id is provided, check if the user is a team member:
    #    (You can call verify_team_member manually here, or inject it)
    # 2. Create the Board record with owner_id = current_user.id
    # 3. Add to DB, commit, and return it.
    pass


# [read] list all boards the current user has access to
@board_router.get("/", response_model=list[BoardOut])
def get_boards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # TODO: Fill in the logic.
    # We want to retrieve:
    # 1. All personal boards owned by the user (Board.team_id == None and Board.owner_id == current_user.id)
    # OR
    # 2. All team boards for teams where the user is a member or owner.
    #    - Hint: Find all team_ids where user is in team_members or owns the team,
    #      then query Board.team_id.in_(team_ids)
    pass


# [read] get details of a specific board
@board_router.get("/{board_id}", response_model=BoardOut)
def get_board(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
    # TODO: Inject the board access verification dependency:
    # board: Board = Depends(verify_board_access)
):
    # TODO: Since verify_board_access runs automatically before this route executes,
    # you can simply return the injected board object here!
    pass


# [update] modify a board's details
@board_router.patch("/{board_id}", response_model=BoardOut)
def update_board(
    board_id: int,
    board_data: BoardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # TODO: Fill in the logic.
    # 1. Retrieve board (or use verify_board_access)
    # 2. Ensure only the board owner or the team owner (if it's a team board) can edit.
    # 3. Update fields and return the updated board.
    pass


# [delete] remove a board
@board_router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # TODO: Fill in the logic.
    # 1. Retrieve board
    # 2. Verify only board owner or team owner can delete.
    # 3. Delete and commit.
    pass
