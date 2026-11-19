from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    """
    Represents an employee or HR administrator.
    In the Zoho preview, user identity is assumed.
    In the External Dashboard, this supports login and role-based permissions.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. "EMP001"
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    role = Column(String(20), default="employee", nullable=False) # "employee" or "hr_admin"
    department = Column(String(100), default="Engineering")

    # Relationships
    assignments = relationship("CourseAssignment", back_populates="employee", cascade="all, delete-orphan")


class Course(Base):
    """
    Master list of courses (e.g. COF-C03, GES-C02).
    Allows courses to be assigned dynamically without altering database columns.
    """
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. "COF-C03"
    course_name = Column(String(200), nullable=False)
    certification_name = Column(String(200), nullable=True) # e.g. "Snowflake SnowPro Core"
    description = Column(Text, nullable=True)

    # Relationships
    assignments = relationship("CourseAssignment", back_populates="course")


class CourseAssignment(Base):
    """
    Represents an assignment of a course to an employee.
    Enforces that an active course cannot be assigned twice to the same employee.
    Maintains both Employee Course Status and Admin Overall Status separately.
    """
    __tablename__ = "course_assignments"
    __table_args__ = (
        UniqueConstraint('employee_id', 'course_id', name='uq_employee_course'),
    )

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    # Assignment & Lifecycle Dates
    assigned_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    start_date = Column(DateTime, nullable=True) # Automatically set when employee starts
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Employee Progress Fields (Rules: Not Started = 0%, In Progress = 1-99%, Completed = 100%)
    course_status = Column(String(50), default="Not Started", nullable=False) # "Not Started", "In Progress", "Completed"
    progress_percentage = Column(Integer, default=0, nullable=False)
    
    # Examination & Certification Info
    exam_date = Column(Date, nullable=True) # Planned examination date
    certified_date = Column(Date, nullable=True) # Date achieved
    certification_name = Column(String(200), nullable=True)

    # Overall Administrative Status (Rules: In Progress, On Risk, Certified)
    # Stored separately so employee updates don't inadvertently overwrite HR risk assessments
    admin_status = Column(String(50), default="In Progress", nullable=False) # "In Progress", "On Risk", "Certified"
    
    # Comments & Notes
    latest_comments = Column(Text, nullable=True)

    # Relationships
    employee = relationship("User", back_populates="assignments")
    course = relationship("Course", back_populates="assignments")
    progress_history = relationship("ProgressHistory", back_populates="assignment", cascade="all, delete-orphan", order_by="ProgressHistory.timestamp.desc()")
    audit_logs = relationship("AuditLog", back_populates="assignment", cascade="all, delete-orphan", order_by="AuditLog.timestamp.desc()")


class ProgressHistory(Base):
    """
    Scalable progress submissions history.
    Tracks all updates over time (e.g. Week 1, Week 2, Week 3, etc.)
    Preserves existing Excel 'Progress - Week1' & 'Progress - Week2' records.
    """
    __tablename__ = "progress_history"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("course_assignments.id"), nullable=False)
    reporting_period = Column(String(50), default="Weekly Update", nullable=False) # e.g. "Week 1", "Week 2"
    progress_percentage = Column(Integer, nullable=False)
    comments = Column(Text, nullable=True)
    submitted_by = Column(String(100), nullable=False) # Name or ID of submitter
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    assignment = relationship("CourseAssignment", back_populates="progress_history")


class AuditLog(Base):
    """
    Audit Trail: Section 3.2 & 5.4 requirement.
    Records every administrative change with original value, updated value,
    admin identity, timestamp, and modification reason.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("course_assignments.id"), nullable=False)
    administrator_id = Column(String(50), nullable=False) # Employee ID of admin
    administrator_name = Column(String(100), nullable=False)
    field_name = Column(String(100), nullable=False) # e.g. "progress_percentage", "admin_status", "exam_date"
    original_value = Column(String(255), nullable=True)
    updated_value = Column(String(255), nullable=True)
    reason = Column(Text, nullable=True) # Reason for change
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    assignment = relationship("CourseAssignment", back_populates="audit_logs")
