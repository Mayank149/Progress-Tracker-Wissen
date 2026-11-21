from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import User
from .schemas import UserRead
from .seed_data import seed_database
from .routers import employee, admin

# Locate frontend directory
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"


# ---------------------------------------------------------
# Application Lifespan: Auto-init database & seed on startup
# ---------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed initial sample data
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Shutdown logic (if any)


# ---------------------------------------------------------
# FastAPI App Initialization
# ---------------------------------------------------------
app = FastAPI(
    title="Employee Course Progress Management System API",
    description="Unified backend supporting both Zoho-Native Preview and External Dashboard.",
    version="1.0.0",
    lifespan=lifespan
)

# ---------------------------------------------------------
# CORS Configuration (Allows frontend React app to connect)
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to company domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Demo Authentication & User Switching Schemas & Routes
# ---------------------------------------------------------
class LoginRequest(BaseModel):
    identifier: str # Email or Employee ID (e.g. 'EMP101' or 'alex.morgan@company.com')

class LoginResponse(BaseModel):
    user: UserRead
    token_type: str = "bearer"
    access_token: str
    message: str


@app.get("/", tags=["System"])
def root():
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {
        "system": "Employee Course Progress Management System",
        "status": "Online",
        "documentation": "/docs"
    }

# Mount frontend assets
if FRONTEND_DIR.exists():
    css_dir = FRONTEND_DIR / "css"
    js_dir = FRONTEND_DIR / "js"
    img_dir = FRONTEND_DIR / "img"
    assets_dir = FRONTEND_DIR / "assets"
    if css_dir.exists():
        app.mount("/css", StaticFiles(directory=str(css_dir)), name="css")
    if js_dir.exists():
        app.mount("/js", StaticFiles(directory=str(js_dir)), name="js")
    if img_dir.exists():
        app.mount("/img", StaticFiles(directory=str(img_dir)), name="img")
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


@app.get("/api/auth/users", response_model=List[UserRead], tags=["Authentication"])
def list_available_users(db: Session = Depends(get_db)):
    """
    Returns available test users.
    Allows easy switching between Employees and HR Admins in both
    the External Dashboard (login page) and Zoho preview.
    """
    return db.query(User).all()


@app.post("/api/auth/login", response_model=LoginResponse, tags=["Authentication"])
def demo_login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Simulates login for the External Dashboard (supporting Company SSO / Employee ID).
    """
    id_clean = login_data.identifier.strip()
    user = db.query(User).filter(
        (User.employee_id.ilike(id_clean)) | (User.email.ilike(id_clean))
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with identifier '{id_clean}' not found. Please try 'EMP101' or 'HR001'."
        )

    return LoginResponse(
        user=user,
        access_token=f"demo-token-{user.employee_id}",
        message=f"Welcome {user.name} ({user.role})"
    )


# ---------------------------------------------------------
# Include Sub-Routers
# ---------------------------------------------------------
app.include_router(employee.router)
app.include_router(admin.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
