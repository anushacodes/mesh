from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from ..database.schema import User, UserSession
from ..database.session import get_db
from ..security import (
    hash_password, 
    verify_password, 
    create_access_token, 
    generate_refresh_token, 
    hash_token,
    get_current_active_user
)
from ..schemas import UserLogin, UserRegister, UserToken, UserSessionOut

auth_router = APIRouter()

# Session expiration defaults
REFRESH_TOKEN_EXPIRE_DAYS = 7


@auth_router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="email already registered"
        )

    db_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@auth_router.post("/login", response_model=UserToken, status_code=status.HTTP_201_CREATED)
def login(user: UserLogin, request: Request, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, str(db_user.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid credentials"
        )

    # Purge expired sessions for this user to prevent table bloat
    db.query(UserSession).filter(
        UserSession.user_id == db_user.id,
        UserSession.expires_at < datetime.now(timezone.utc)
    ).delete(synchronize_session=False)

    # 1. Generate access and refresh tokens
    access_token = create_access_token({"sub": str(db_user.id)})
    raw_refresh_token = generate_refresh_token()
    hashed_ref_token = hash_token(raw_refresh_token)

    # 2. Get client metadata
    user_agent = request.headers.get("user-agent", "Unknown Device")
    client_ip = request.client.host if request.client else "Unknown IP"

    # 3. Save session in the database
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    session = UserSession(
        user_id=db_user.id,
        token_hash=hashed_ref_token,
        device_info=user_agent,
        ip_address=client_ip,
        expires_at=expires_at
    )
    db.add(session)
    db.commit()

    return UserToken(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        token_type="bearer"
    )


@auth_router.post("/refresh", response_model=UserToken)
def refresh(payload: dict, request: Request, db: Session = Depends(get_db)):
    """Refresh Token Rotation (RTR) endpoint."""
    raw_refresh_token = payload.get("refresh_token")
    if not raw_refresh_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="refresh_token required")

    # Hash the provided token to look it up securely
    hashed_token = hash_token(raw_refresh_token)
    session = db.query(UserSession).filter(UserSession.token_hash == hashed_token).first()

    # Security check: Does session exist? Is it revoked? Is it expired?
    if not session or session.is_revoked or session.expires_at < datetime.utcnow():
        # If it was revoked or expired, we deny access
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")

    # 1. Generate a brand new set of tokens (access + rotated refresh)
    new_access_token = create_access_token({"sub": str(session.user_id)})
    new_raw_refresh_token = generate_refresh_token()
    new_hashed_token = hash_token(new_raw_refresh_token)

    # 2. Update session details (sliding expiration & updated IP/metadata)
    session.token_hash = new_hashed_token
    session.expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    if request.client:
        session.ip_address = request.client.host
    session.device_info = request.headers.get("user-agent", "Unknown Device")
    
    db.commit()

    return UserToken(
        access_token=new_access_token,
        refresh_token=new_raw_refresh_token,
        token_type="bearer"
    )


@auth_router.get("/sessions", response_model=list[UserSessionOut])
def get_active_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """List all active, unrevoked sessions for the logged-in user."""
    return db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_revoked == False,
        UserSession.expires_at > datetime.utcnow()
    ).all()


@auth_router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Revoke (force log out) a specific session."""
    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session.is_revoked = True
    db.commit()


@auth_router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: dict, db: Session = Depends(get_db)):
    """Revoke the active session."""
    raw_refresh_token = payload.get("refresh_token")
    if not raw_refresh_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="refresh_token required")

    hashed_token = hash_token(raw_refresh_token)
    session = db.query(UserSession).filter(UserSession.token_hash == hashed_token).first()
    if session:
        session.is_revoked = True
        db.commit()