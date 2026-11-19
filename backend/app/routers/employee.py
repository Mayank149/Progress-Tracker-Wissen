from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import User, CourseAssignment, ProgressHistory
from ..schemas import (
    CourseAssignmentRead,
    EmployeeDashboardStats,
    EmployeeProgressUpdate,
    ProgressHistoryRead,
)

router = APIRouter(prefix="/api/employee", tags=["Employee Portal"])

def get_current_employee(
    employee_id: str = Query("EMP101", description="Employee ID (e.g. EMP101 for Alex Morgan)"),
    db: Session = Depends(get_db)
) -> User:
    """
    Retrieves the employee by employee_id.
    Allows easy switching of active employee context for both the Zoho preview and external dashboard.
    """
    user = db.query(User).filter(User.employee_id == employee_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID '{employee_id}' not found."
        )
    return user


@router.get("/dashboard", response_model=EmployeeDashboardStats)
def get_employee_dashboard(
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Section 4.1: Employee Dashboard Overview
    Displays employee name, ID, email, total assigned courses,
    completed courses, courses in progress, and courses not yet started.
    """
    assignments = db.query(CourseAssignment).filter(
        CourseAssignment.employee_id == current_user.id
    ).all()

    total_assigned = len(assignments)
    completed = sum(1 for a in assignments if a.course_status == "Completed")
    in_progress = sum(1 for a in assignments if a.course_status == "In Progress")
    not_started = sum(1 for a in assignments if a.course_status == "Not Started")
    certified = sum(1 for a in assignments if a.admin_status == "Certified" or a.certified_date is not None)

    return EmployeeDashboardStats(
        employee_id=current_user.employee_id,
        name=current_user.name,
        email=current_user.email,
        total_assigned=total_assigned,
        completed=completed,
        in_progress=in_progress,
        not_started=not_started,
        certified=certified
    )


@router.get("/courses", response_model=List[CourseAssignmentRead])
def get_assigned_courses(
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Section 4.2: Course Selection
    Returns only the courses assigned to the logged-in employee.
    Includes course metadata, progress status, and history.
    """
    assignments = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.course),
        joinedload(CourseAssignment.progress_history),
        joinedload(CourseAssignment.audit_logs)
    ).filter(
        CourseAssignment.employee_id == current_user.id
    ).all()

    return assignments


@router.post("/progress", response_model=CourseAssignmentRead)
def submit_course_progress(
    update_data: EmployeeProgressUpdate,
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Section 4.3, 4.4, 4.5: Course Progress Update Submission
    - Validates submitted information (percentages match status rules).
    - Updates course status, progress percentage, exam date, and comments.
    - Automatically records start_date if moving out of 'Not Started'.
    - Automatically timestamps the submission.
    - Appends a new immutable record into progress_history.
    - Preserves admin_status (e.g. On Risk remains untouched).
    """
    # 1. Fetch the assignment and ensure it belongs to this employee
    assignment = db.query(CourseAssignment).filter(
        CourseAssignment.id == update_data.assignment_id,
        CourseAssignment.employee_id == current_user.id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found or does not belong to the current employee."
        )

    now = datetime.now(timezone.utc)

    # 2. Rule: If transitioning from 'Not Started' to 'In Progress', set start_date automatically
    if assignment.course_status == "Not Started" and update_data.course_status != "Not Started":
        if not assignment.start_date:
            assignment.start_date = now

    # 3. Update the assignment record
    assignment.course_status = update_data.course_status
    assignment.progress_percentage = update_data.progress_percentage
    assignment.last_updated = now

    if update_data.exam_date is not None:
        assignment.exam_date = update_data.exam_date

    if update_data.certified_date is not None:
        assignment.certified_date = update_data.certified_date

    if update_data.certification_name is not None:
        assignment.certification_name = update_data.certification_name

    if update_data.comments:
        assignment.latest_comments = update_data.comments

    # 4. Append to Progress History (Section 4.5 & 6.3)
    # Determine the reporting period (e.g. Next Week number or user provided label)
    history_count = db.query(ProgressHistory).filter(
        ProgressHistory.assignment_id == assignment.id
    ).count()
    period_label = update_data.reporting_period or f"Week {history_count + 1}"

    history_entry = ProgressHistory(
        assignment_id=assignment.id,
        reporting_period=period_label,
        progress_percentage=update_data.progress_percentage,
        comments=update_data.comments,
        submitted_by=current_user.name,
        timestamp=now
    )
    db.add(history_entry)

    db.commit()
    db.refresh(assignment)

    return assignment


@router.get("/assignment/{assignment_id}/history", response_model=List[ProgressHistoryRead])
def get_assignment_history(
    assignment_id: int,
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Returns the submission history for a specific course assignment.
    """
    assignment = db.query(CourseAssignment).filter(
        CourseAssignment.id == assignment_id,
        CourseAssignment.employee_id == current_user.id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found."
        )

    history = db.query(ProgressHistory).filter(
        ProgressHistory.assignment_id == assignment_id
    ).order_by(ProgressHistory.timestamp.desc()).all()

    return history
