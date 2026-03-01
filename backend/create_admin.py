from app.db.session import SessionLocal
from app.models.domain import Organization, Role, User
from app.core.security import get_password_hash

def ensure_admin():
    db = SessionLocal()
    org = db.query(Organization).first()
    
    r_admin = db.query(Role).filter(Role.name == "SuperAdmin").first()
    if not r_admin:
        r_admin = Role(name="SuperAdmin", description="System Administrator")
        db.add(r_admin)
        db.commit()
        db.refresh(r_admin)
        
    user = db.query(User).filter(User.email == "admin@digitalpsych.com").first()
    if not user:
        user = User(
            email="admin@digitalpsych.com",
            hashed_password=get_password_hash("admin123"),
            organization_id=org.id if org else None,
            role_id=r_admin.id,
            is_active=True
        )
        db.add(user)
        db.commit()
        print("Admin user created.")
    else:
        print("Admin user already exists.")
        
    db.close()

if __name__ == "__main__":
    ensure_admin()
