from app import app, db
from models import User
import time

def setup_db():
    with app.app_context():
        # Drop all tables and recreate them (since user said "start empty with 1 admin 1 doctor")
        print("Dropping existing tables...")
        db.drop_all()
        print("Creating tables...")
        db.create_all()
        
        print("Seeding initial users...")
        
        # Admin User
        admin = User(name='System Admin', email='admin@osteoverse.com', role='Admin', is_approved_by_admin=True)
        admin.set_password('admin123')
        db.session.add(admin)
        
        # Doctor User
        doctor = User(name='Dr. Smith', email='doctor@osteoverse.com', role='Doctor', is_approved_by_admin=True)
        doctor.set_password('doctor123')
        db.session.add(doctor)
        
        db.session.commit()
        print("Database initialized with 1 Admin and 1 Doctor successfully!")

if __name__ == "__main__":
    setup_db()
