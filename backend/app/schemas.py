from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

# ---------------------------------------------------------
# User Schemas
# ---------------------------------------------------------
class UserBase(BaseModel):
    employee_id: str
    name: str
    email: str
    role: str = Field(default="employee", description="'employee' or 'hr_admin'")
    department: Optional[str] = "Engineering"

class UserCreate(UserBase):
    pass

class UserRead(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Course Schemas
# ---------------------------------------------------------
class CourseBase(BaseModel):
    course_code: str
    course_name: str
    certification_name: Optional[str] = None
    description: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseRead(CourseBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Progress History & Audit Log Schemas
# ---------------------------------------------------------
class ProgressHistoryRead(BaseModel):
    id: int
    assignment_id: int
    reporting_period: str
    progress_percentage: int
    comments: Optional[str] = None
    submitted_by: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogRead(BaseModel):
    id: int
    assignment_id: int
    administrator_id: str
    administrator_name: str
    field_name: str
    original_value: Optional[str] = None
    updated_value: Optional[str] = None
    reason: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Course Assignment Schemas
# ---------------------------------------------------------
class CourseAssignmentCreate(BaseModel):
    """Admin assigns a course to an employee"""
    employee_id: int
    course_id: int
    start_date: Optional[datetime] = None
    exam_date: Optional[date] = None
    admin_status: Optional[str] = "In Progress"


class EmployeeProgressUpdate(BaseModel):
    """
    Employee updates progress.
    Enforces Section 4.4 business rules:
      - Not Started -> progress must be 0%
      - In Progress -> progress must be 1% to 99%
      - Completed   -> progress automatically set to 100%
    """
    assignment_id: int
    course_status: str = Field(..., description="'Not Started', 'In Progress', or 'Completed'")
    progress_percentage: int = Field(..., ge=0, le=100)
    reporting_period: Optional[str] = "Weekly Update"
    exam_date: Optional[date] = None
    certified_date: Optional[date] = None
    certification_name: Optional[str] = None
    comments: Optional[str] = None

    @model_validator(mode="after")
    def validate_status_and_percentage(self):
        status = self.course_status.strip()
        progress = self.progress_percentage

        if status == "Not Started":
            self.progress_percentage = 0
        elif status == "In Progress":
            if not (1 <= progress <= 99):
                raise ValueError("For 'In Progress' status, progress must be between 1% and 99%.")
        elif status == "Completed":
            self.progress_percentage = 100
        else:
            raise ValueError(f"Invalid course status: '{status}'. Allowed values: Not Started, In Progress, Completed.")
        
        return self


class AdminAssignmentUpdate(BaseModel):
    """
    Admin updates employee progress or administrative status.
    Requires admin identification and modification reason for the audit trail (Section 3.2 & 5.4).
    """
    course_status: Optional[str] = None # "Not Started", "In Progress", "Completed"
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)
    admin_status: Optional[str] = None   # "In Progress", "On Risk", "Certified"
    exam_date: Optional[date] = None
    certified_date: Optional[date] = None
    certification_name: Optional[str] = None
    comments: Optional[str] = None
    
    # Audit trail details
    administrator_id: str = Field(..., description="Employee ID of the admin making changes")
    administrator_name: str = Field(..., description="Name of the admin")
    reason: str = Field(..., min_length=3, description="Reason for the administrative change")


class CourseAssignmentRead(BaseModel):
    id: int
    employee_id: int
    course_id: int
    assigned_date: datetime
    start_date: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    course_status: str
    progress_percentage: int
    exam_date: Optional[date] = None
    certified_date: Optional[date] = None
    certification_name: Optional[str] = None
    admin_status: str
    latest_comments: Optional[str] = None
    
    employee: Optional[UserRead] = None
    course: Optional[CourseRead] = None
    progress_history: List[ProgressHistoryRead] = []
    audit_logs: List[AuditLogRead] = []

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Dashboard Summary / Stats Schemas
# ---------------------------------------------------------
class EmployeeDashboardStats(BaseModel):
    employee_id: str
    name: str
    email: str
    total_assigned: int
    completed: int
    in_progress: int
    not_started: int
    certified: int


class AdminDashboardStats(BaseModel):
    total_employees: int
    total_assignments: int
    not_started: int
    in_progress: int
    completed: int
    on_risk: int
    certified: int
    upcoming_exams_count: int
