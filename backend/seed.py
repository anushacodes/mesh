import sys
import os

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.database.session import SessionLocal
from api.database.schema import User, Team, TeamMember, Board, Task
from api.security import hash_password

def seed_db():
    db = SessionLocal()
    try:
        # Check if database is already seeded
        existing_user = db.query(User).filter(User.email == "me@example.com").first()
        if existing_user:
            print("Database already contains seed data.")
            return

        print("Seeding database...")

        # 1. Create Users
        me = User(
            name="Me (Owner)",
            email="me@example.com",
            hashed_password=hash_password("password123"),
            role="user",
            is_active=True
        )
        member = User(
            name="Bob (Member)",
            email="member@example.com",
            hashed_password=hash_password("password123"),
            role="user",
            is_active=True
        )
        admin = User(
            name="Charlie (Co-Owner)",
            email="admin@example.com",
            hashed_password=hash_password("password123"),
            role="user",
            is_active=True
        )
        stranger = User(
            name="David (Stranger)",
            email="stranger@example.com",
            hashed_password=hash_password("password123"),
            role="user",
            is_active=True
        )

        db.add(me)
        db.add(member)
        db.add(admin)
        db.add(stranger)
        db.commit()
        
        # Refresh to get IDs
        db.refresh(me)
        db.refresh(member)
        db.refresh(admin)
        db.refresh(stranger)
        print("Created test users.")

        # 2. Create Team owned by Me
        team = Team(
            name="Alpha Engineering",
            description="The core software development group.",
            owner_id=me.id
        )
        db.add(team)
        db.commit()
        db.refresh(team)
        print(f"Created Team: {team.name} (Owned by {me.name})")

        # 3. Setup Memberships
        # Member role (Bob)
        membership_member = TeamMember(
            team_id=team.id,
            user_id=member.id,
            role="member"
        )
        # Owner/Admin role (Charlie)
        membership_admin = TeamMember(
            team_id=team.id,
            user_id=admin.id,
            role="owner"
        )
        db.add(membership_member)
        db.add(membership_admin)
        db.commit()
        print("Added team members (Bob as member, Charlie as owner).")

        # 4. Create Personal Board & Tasks for Me
        personal_board = Board(
            name="My Personal Space",
            description="Private board for personal tracking.",
            owner_id=me.id,
            team_id=None
        )
        db.add(personal_board)
        db.commit()
        db.refresh(personal_board)

        personal_task = Task(
            title="Buy groceries",
            description="Milk, eggs, and bread.",
            status="todo",
            priority="low",
            owner_id=me.id,
            board_id=personal_board.id
        )
        db.add(personal_task)
        db.commit()
        print("Created personal board and tasks.")

        # 5. Create Team Board & Tasks
        team_board = Board(
            name="Team Sprint Board",
            description="Kanban board for Alpha Engineering.",
            owner_id=me.id,
            team_id=team.id
        )
        db.add(team_board)
        db.commit()
        db.refresh(team_board)

        team_tasks = [
            Task(
                title="Design IAM schemas",
                description="Map users, teams, and boards with foreign keys.",
                status="done",
                priority="high",
                owner_id=me.id,
                board_id=team_board.id
            ),
            Task(
                title="Implement RBAC dependencies",
                description="Write verify_board_access and verify_team_member dependencies in FastAPI.",
                status="in-progress",
                priority="medium",
                owner_id=me.id,
                board_id=team_board.id
            ),
            Task(
                title="Integrate frontend views",
                description="Create board lists, details, and context switching.",
                status="todo",
                priority="low",
                owner_id=me.id,
                board_id=team_board.id
            )
        ]
        db.bulk_save_objects(team_tasks)
        db.commit()
        print("Created Team Board and team tasks.")

        print("\nSeeding complete! Try logging in as different users to test RBAC:")
        print("------------------------------------------------------------------")
        print("1. me@example.com (Team Owner)       - Full access to all personal & team boards.")
        print("2. member@example.com (Team Member)   - Access to team boards, but personal space is empty.")
        print("3. admin@example.com (Team Co-Owner)  - Access to team boards, but personal space is empty.")
        print("4. stranger@example.com (Stranger)    - No access to team boards (403 Forbidden).")
        print("Password for all users is: password123")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
