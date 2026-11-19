import io
from datetime import datetime, date, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session, joinedload
import pandas as pd

from ..database import get_db
from ..models import User, Course, CourseAssignment, ProgressHistory, AuditLog
from ..schemas import (
    AdminAssignmentUpdate,
    AdminDashboardStats,
    AuditLogRead,
    CourseAssignmentCreate,
    CourseAssignmentRead,
    CourseCreate,
    CourseRead,
    UserRead,
)

router = APIRouter(prefix="/api/admin", tags=["Admin Portal"])


# ---------------------------------------------------------
# 1. Admin Dashboard Overview (Section 5.1)
# ---------------------------------------------------------
@router.get("/dashboard", response_model=AdminDashboardStats)
def get_admin_dashboard(db: Session = Depends(get_db)):
    """
    Section 5.1: Admin Dashboard Overview
    Provides organization-wide statistics:
    - Total employees and total assignments
    - Breakdown by status: Not Started, In Progress, Completed
    - At-risk count and certified count
    - Upcoming examination count (scheduled within next 30 days)
    """
    total_employees = db.query(User).filter(User.role == "employee").count()
    total_assignments = db.query(CourseAssignment).count()

    not_started = db.query(CourseAssignment).filter(CourseAssignment.course_status == "Not Started").count()
    in_progress = db.query(CourseAssignment).filter(CourseAssignment.course_status == "In Progress").count()
    completed = db.query(CourseAssignment).filter(CourseAssignment.course_status == "Completed").count()

    on_risk = db.query(CourseAssignment).filter(CourseAssignment.admin_status == "On Risk").count()
    certified = db.query(CourseAssignment).filter(CourseAssignment.admin_status == "Certified").count()

    today = date.today()
    upcoming_exams = db.query(CourseAssignment).filter(
        CourseAssignment.exam_date >= today
    ).count()

    return AdminDashboardStats(
        total_employees=total_employees,
        total_assignments=total_assignments,
        not_started=not_started,
        in_progress=in_progress,
        completed=completed,
        on_risk=on_risk,
        certified=certified,
        upcoming_exams_count=upcoming_exams
    )


# ---------------------------------------------------------
# 2. Master Courses & Employee Management (Section 5.2 & 5.3)
# ---------------------------------------------------------
@router.get("/courses", response_model=List[CourseRead])
def list_master_courses(db: Session = Depends(get_db)):
    """Returns master list of courses for course assignment dropdown"""
    return db.query(Course).all()


@router.post("/courses", response_model=CourseRead)
def create_course(course_in: CourseCreate, db: Session = Depends(get_db)):
    """Add a new course to the master list"""
    existing = db.query(Course).filter(Course.course_code == course_in.course_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Course code '{course_in.course_code}' already exists."
        )
    course = Course(**course_in.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/employees", response_model=List[UserRead])
def list_employees(
    search: Optional[str] = Query(None, description="Search by name, ID, or email"),
    db: Session = Depends(get_db)
):
    """
    Section 5.2: View all employees and search by ID, name, or email.
    """
    query = db.query(User).filter(User.role == "employee")
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (User.name.ilike(s)) | (User.employee_id.ilike(s)) | (User.email.ilike(s))
        )
    return query.all()


# ---------------------------------------------------------
# 3. Course Assignment & Duplicate Prevention (Section 5.3)
# ---------------------------------------------------------
@router.post("/assign-course", response_model=CourseAssignmentRead)
def assign_course_to_employee(
    assignment_in: CourseAssignmentCreate,
    db: Session = Depends(get_db)
):
    """
    Section 5.3: Course Assignment
    - Assigns course to an employee.
    - Prevents accidental duplicate active assignments of the same course.
    - Immediately reflects in the employee dashboard.
    """
    # 1. Verify employee and course exist
    employee = db.query(User).filter(User.id == assignment_in.employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")

    course = db.query(Course).filter(Course.id == assignment_in.course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

    # 2. Check for duplicate assignment
    existing = db.query(CourseAssignment).filter(
        CourseAssignment.employee_id == assignment_in.employee_id,
        CourseAssignment.course_id == assignment_in.course_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee '{employee.name}' is already assigned to course '{course.course_code}'."
        )

    # 3. Create assignment
    new_assignment = CourseAssignment(
        employee_id=assignment_in.employee_id,
        course_id=assignment_in.course_id,
        start_date=assignment_in.start_date,
        exam_date=assignment_in.exam_date,
        certification_name=course.certification_name,
        admin_status=assignment_in.admin_status or "In Progress",
        course_status="Not Started",
        progress_percentage=0
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment


# ---------------------------------------------------------
# 4. Monitoring & Filtering (Section 5.5)
# ---------------------------------------------------------
@router.get("/assignments", response_model=List[CourseAssignmentRead])
def list_assignments(
    course_status: Optional[str] = Query(None, description="Filter by: Not Started, In Progress, Completed"),
    admin_status: Optional[str] = Query(None, description="Filter by: In Progress, On Risk, Certified"),
    search: Optional[str] = Query(None, description="Filter by employee name, ID, or course code"),
    db: Session = Depends(get_db)
):
    """
    Section 5.5: Employee Progress Monitoring
    Allows filtering by status, at-risk condition, and employee/course search.
    """
    query = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.employee),
        joinedload(CourseAssignment.course),
        joinedload(CourseAssignment.progress_history),
        joinedload(CourseAssignment.audit_logs)
    )

    if course_status:
        query = query.filter(CourseAssignment.course_status == course_status)
    if admin_status:
        query = query.filter(CourseAssignment.admin_status == admin_status)
    if search:
        s = f"%{search.strip()}%"
        query = query.join(CourseAssignment.employee).join(CourseAssignment.course).filter(
            (User.name.ilike(s)) | (User.employee_id.ilike(s)) | (Course.course_code.ilike(s))
        )

    return query.all()


# ---------------------------------------------------------
# 5. Progress Modification & Audit Trail (Section 3.2 & 5.4)
# ---------------------------------------------------------
@router.put("/assignment/{assignment_id}", response_model=CourseAssignmentRead)
def modify_assignment(
    assignment_id: int,
    update_in: AdminAssignmentUpdate,
    db: Session = Depends(get_db)
):
    """
    Section 5.4: Administrative Progress Modification
    - Corrects incorrectly entered progress percentages, statuses, or dates.
    - Automatically records changes in the Audit Log with old value, new value,
      admin identity, timestamp, and explanation reason.
    """
    assignment = db.query(CourseAssignment).filter(CourseAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")

    now = datetime.now(timezone.utc)
    changes = []

    # Check and audit course_status
    if update_in.course_status is not None and update_in.course_status != assignment.course_status:
        changes.append(("course_status", str(assignment.course_status), str(update_in.course_status)))
        assignment.course_status = update_in.course_status

    # Check and audit progress_percentage
    if update_in.progress_percentage is not None and update_in.progress_percentage != assignment.progress_percentage:
        changes.append(("progress_percentage", str(assignment.progress_percentage), str(update_in.progress_percentage)))
        assignment.progress_percentage = update_in.progress_percentage

    # Check and audit admin_status
    if update_in.admin_status is not None and update_in.admin_status != assignment.admin_status:
        changes.append(("admin_status", str(assignment.admin_status), str(update_in.admin_status)))
        assignment.admin_status = update_in.admin_status

    # Check and audit exam_date
    if update_in.exam_date is not None and update_in.exam_date != assignment.exam_date:
        changes.append(("exam_date", str(assignment.exam_date), str(update_in.exam_date)))
        assignment.exam_date = update_in.exam_date

    # Check and audit certified_date
    if update_in.certified_date is not None and update_in.certified_date != assignment.certified_date:
        changes.append(("certified_date", str(assignment.certified_date), str(update_in.certified_date)))
        assignment.certified_date = update_in.certified_date

    # Optional comments & certification name
    if update_in.certification_name is not None:
        assignment.certification_name = update_in.certification_name
    if update_in.comments is not None:
        assignment.latest_comments = update_in.comments

    assignment.last_updated = now

    # Record all audited changes into AuditLog table
    for field, old_val, new_val in changes:
        audit_entry = AuditLog(
            assignment_id=assignment.id,
            administrator_id=update_in.administrator_id,
            administrator_name=update_in.administrator_name,
            field_name=field,
            original_value=old_val,
            updated_value=new_val,
            reason=update_in.reason,
            timestamp=now
        )
        db.add(audit_entry)

    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/audit-logs", response_model=List[AuditLogRead])
def list_audit_logs(db: Session = Depends(get_db)):
    """Returns historical administrative modifications (Section 3.2 & 5.4)"""
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()


# ---------------------------------------------------------
# 6. Excel Export (Section 5.6, 6.1, 6.3)
# ---------------------------------------------------------
@router.get("/export-excel")
def export_to_excel(db: Session = Depends(get_db)):
    """
    Section 5.6 & 6.1: Excel Export preserving the original spreadsheet format.
    Fields included:
    - ID (Employee ID)
    - Name (Employee Name)
    - Course Code
    - Course Name
    - Name of the Certification
    - Start Date
    - Status (Administrative Status: In Progress, On Risk, Certified)
    - Course Status (Not Started, In Progress, Completed)
    - Progress %
    - Exam Date
    - Certified Date
    - Comments
    - Progress - Week1 (First Weekly Progress Record)
    - Progress - Week2 (Second Weekly Progress Record)
    - Email
    """
    assignments = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.employee),
        joinedload(CourseAssignment.course),
        joinedload(CourseAssignment.progress_history)
    ).all()

    rows = []
    for a in assignments:
        # Extract Week1 and Week2 records if available from history
        week1_val = ""
        week2_val = ""
        
        # Sort history chronologically
        history_sorted = sorted(a.progress_history, key=lambda x: x.timestamp)
        for h in history_sorted:
            if "week 1" in h.reporting_period.lower() and not week1_val:
                week1_val = f"{h.progress_percentage}%"
            elif "week 2" in h.reporting_period.lower() and not week2_val:
                week2_val = f"{h.progress_percentage}%"

        rows.append({
            "ID": a.employee.employee_id if a.employee else "",
            "Name": a.employee.name if a.employee else "",
            "Email": a.employee.email if a.employee else "",
            "Course Code": a.course.course_code if a.course else "",
            "Course Name": a.course.course_name if a.course else "",
            "Name of the Certification": a.certification_name or (a.course.certification_name if a.course else ""),
            "Start Date": a.start_date.strftime("%Y-%m-%d") if a.start_date else "",
            "Status": a.admin_status, # Overall administrative status
            "Course Status": a.course_status,
            "Progress %": f"{a.progress_percentage}%",
            "Exam Date": a.exam_date.strftime("%Y-%m-%d") if a.exam_date else "",
            "Certified Date": a.certified_date.strftime("%Y-%m-%d") if a.certified_date else "",
            "Comments": a.latest_comments or "",
            "Progress - Week1": week1_val,
            "Progress - Week2": week2_val
        })

    df = pd.DataFrame(rows)

    # Write DataFrame to an in-memory Excel buffer using openpyxl
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Course Progress Tracker")

    output.seek(0)

    filename = f"Course_Progress_Export_{date.today().strftime('%Y%m%d')}.xlsx"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }

    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )
