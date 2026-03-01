import sqlite3
import os
import sys

# Add backend directory to path so we can import app modules
# However, we can just use pure sqlite3 for ALTER TABLE
db_path = "digitalpsych.db"

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
    sys.exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Add gender and date_of_birth to clients
    print("Checking if gender exists in clients...")
    cursor.execute("PRAGMA table_info(clients)")
    columns = [col[1] for col in cursor.fetchall()]

    if "date_of_birth" not in columns:
        print("Adding date_of_birth column...")
        cursor.execute("ALTER TABLE clients ADD COLUMN date_of_birth DATE")
    else:
        print("date_of_birth already exists.")

    if "gender" not in columns:
        print("Adding gender column...")
        cursor.execute("ALTER TABLE clients ADD COLUMN gender VARCHAR")
    else:
        print("gender already exists.")

    conn.commit()
    print("Columns added successfully.")

except Exception as e:
    print(f"Error altering clients table: {e}")

try:
    # Now use SQLAlchemy to create any missing tables (i.e. clinical_notes)
    print("Creating new tables via SQLAlchemy create_all()...")
    from app.db.session import engine, Base
    from app.models.domain import Client, ClinicalNote # ensures models are loaded

    Base.metadata.create_all(bind=engine)
    print("Schema synchronized successfully.")
except Exception as e:
    print(f"Error creating tables: {e}")

finally:
    conn.close()
