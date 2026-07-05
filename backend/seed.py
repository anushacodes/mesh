import sys
import os

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.database.session import SessionLocal
from api.database.schema import User, Team, TeamMember, Task
from api.security import hash_password

def seed_db():
    db = SessionLocal()
    try:
        # Check if database is already seeded
        existing_user = db.query(User).filter(User.email == "alice@example.com").first()
        if existing_user:
            print("Database already contains seed data.")
            return

        print("Seeding database...")

        # 1. Create Users
        alice = User(
            name="Alice",
            email="alice@example.com",
            hashed_password=hash_password("password123"),
            role="user",
            is_active=True
        )
        bob = User(
            name="Bob",
            email="bob@example.com",
            hashed_password=hash_password("password123"),
            role="user",
            is_active=True
        )
        db.add(alice)
        db.add(bob)
        db.commit()
        db.refresh(alice)
        db.refresh(bob)
        print(f"Created Users: {alice.name} and {bob.name}")

        # 2. Create a Team owned by Alice
        dev_team = Team(
            name="Alpha Team",
            description="The primary engineering squad handling backend development.",
            owner_id=alice.id
        )
        db.add(dev_team)
        db.commit()
        db.refresh(dev_team)
        print(f"Created Team: {dev_team.name} (Owned by {alice.name})")

        # 3. Add Bob to Alice's Team
        membership = TeamMember(
            team_id=dev_team.id,
            user_id=bob.id,
            role="member"
        )
        db.add(membership)
        db.commit()
        print(f"Added Bob to {dev_team.name}")

        # 4. Create tasks for Alice
        tasks_to_create = [
            Task(
                title="Integrate Auth Flows",
                description="Connect JWT storage to protected pages in React.",
                status="in-progress",
                priority="high",
                owner_id=alice.id
            ),
            Task(
                title="Initialize Alembic Migrations",
                description="Setup migration runner and squash initial development tables.",
                status="done",
                priority="medium",
                owner_id=alice.id
            ),
            Task(
                title="Configure CORS Policies",
                description="Verify wildcard origins allow development port 5173.",
                status="todo",
                priority="low",
                owner_id=alice.id
            )
        ]
        db.bulk_save_objects(tasks_to_create)
        db.commit()
        print("Created sample tasks for Alice")

        print("Seeding complete! You can now log in.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
