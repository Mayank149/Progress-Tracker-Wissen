import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Locate the database file predictably inside the backend directory
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "progress_tracker.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# SQLite requires 'check_same_thread: False' to allow multi-threaded requests in FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

# Each instance of SessionLocal will be an independent database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our SQLAlchemy ORM models
Base = declarative_base()

# FastAPI Dependency: Provides a clean database session per request and closes it after
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

