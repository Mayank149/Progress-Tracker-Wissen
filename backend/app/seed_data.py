from datetime import datetime, date, timedelta, timezone
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models import User, Course, CourseAssignment, ProgressHistory, AuditLog

def seed_database(db: Session = None):
    """
    Populates the database with initial master courses, test users,
    course assignments, weekly progress history (Week 1 & Week 2),
    and sample audit logs matching the project document specifications.
    """
    close_db_at_end = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_db_at_end = True

    try:
        # Check if already seeded
        if db.query(User).first() is not None:
            print("Database already contains records. Skipping seed.")
            return

        print("Seeding database with initial data...")

        # ---------------------------------------------------------
        # 1. Master Courses (Section 6.1: COF-C03, GES-C02, etc.)
        # ---------------------------------------------------------
        courses = [
            Course(
                course_code="COF-C03",
                course_name="Snowflake SnowPro Core Certification",
                certification_name="Snowflake SnowPro Core",
                description="Core skills and knowledge required to design, develop and manage secure, scalable Snowflake solutions."
            ),
            Course(
                course_code="GES-C02",
                course_name="AWS Certified Generative AI Specialist",
                certification_name="AWS Generative AI Specialist",
                description="Specialized certification focusing on LLMs, foundational models, prompt engineering, and GenAI applications on AWS."
            ),
            Course(
                course_code="SAA-C03",
                course_name="AWS Certified Solutions Architect - Associate",
                certification_name="AWS Solutions Architect Associate",
                description="Comprehensive architecture design on AWS cloud infrastructure."
            )
        ]
        db.add_all(courses)
        db.flush() # Flush to get generated course IDs

        # ---------------------------------------------------------
        # 2. Users (Employees & HR Administrator)
        # ---------------------------------------------------------
        users = [
            User(
                employee_id="HR001",
                name="Sarah Jenkins",
                email="sarah.jenkins@wissen.com",
                role="hr_admin",
                department="Human Resources"
            ),
            User(
                employee_id="EMP101",
                name="Alex Morgan",
                email="alex.morgan@wissen.com",
                role="employee",
                department="Data Engineering"
            ),
            User(
                employee_id="EMP102",
                name="David Chen",
                email="david.chen@wissen.com",
                role="employee",
                department="Cloud Architecture"
            ),
            User(
                employee_id="EMP103",
                name="Elena Rostova",
                email="elena.rostova@wissen.com",
                role="employee",
                department="AI & Machine Learning"
            ),
            User(
                employee_id="EMP104",
                name="Marcus Vance",
                email="marcus.vance@wissen.com",
                role="employee",
                department="Software Engineering"
            )
        ]
        db.add_all(users)
        db.flush()

        now = datetime.now(timezone.utc)
        two_weeks_ago = now - timedelta(days=14)
        one_week_ago = now - timedelta(days=7)

        # ---------------------------------------------------------
        # 3. Course Assignments (Section 6.1, 7.1, 7.2)
        # ---------------------------------------------------------
        # Assignment 1: Alex Morgan - COF-C03 (In Progress: 65%, On Track)
        asgn1 = CourseAssignment(
            employee_id=users[1].id, # Alex
            course_id=courses[0].id, # COF-C03
            assigned_date=two_weeks_ago,
            start_date=two_weeks_ago,
            course_status="In Progress",
            progress_percentage=65,
            exam_date=date.today() + timedelta(days=20),
            certification_name=courses[0].certification_name,
            admin_status="In Progress",
            latest_comments="Completed hands-on labs for data loading and stages. Preparing for practice exam."
        )

        # Assignment 2: David Chen - COF-C03 (Completed & Certified: 100%)
        asgn2 = CourseAssignment(
            employee_id=users[2].id, # David
            course_id=courses[0].id, # COF-C03
            assigned_date=now - timedelta(days=45),
            start_date=now - timedelta(days=40),
            course_status="Completed",
            progress_percentage=100,
            exam_date=date.today() - timedelta(days=10),
            certified_date=date.today() - timedelta(days=9),
            certification_name=courses[0].certification_name,
            admin_status="Certified",
            latest_comments="Successfully passed the certification exam on first attempt with 89% score."
        )

        # Assignment 3: Elena Rostova - GES-C02 (On Risk: Stalled at 25% with exam in 5 days)
        asgn3 = CourseAssignment(
            employee_id=users[3].id, # Elena
            course_id=courses[1].id, # GES-C02
            assigned_date=two_weeks_ago,
            start_date=two_weeks_ago,
            course_status="In Progress",
            progress_percentage=25,
            exam_date=date.today() + timedelta(days=5),
            certification_name=courses[1].certification_name,
            admin_status="On Risk",
            latest_comments="Got pulled into urgent client deliverables. Will resume revision this weekend."
        )

        # Assignment 4: Marcus Vance - GES-C02 (Not Started: 0%)
        asgn4 = CourseAssignment(
            employee_id=users[4].id, # Marcus
            course_id=courses[1].id, # GES-C02
            assigned_date=one_week_ago,
            course_status="Not Started",
            progress_percentage=0,
            admin_status="In Progress",
            latest_comments="Reviewing curriculum prerequisites before beginning."
        )

        db.add_all([asgn1, asgn2, asgn3, asgn4])
        db.flush()

        # ---------------------------------------------------------
        # 4. Weekly Progress Records (Section 6.3: Week1 & Week2 compatibility)
        # ---------------------------------------------------------
        history_records = [
            # Alex Morgan history
            ProgressHistory(
                assignment_id=asgn1.id,
                reporting_period="Week 1",
                progress_percentage=35,
                comments="Finished Architecture and Storage modules.",
                submitted_by="Alex Morgan",
                timestamp=two_weeks_ago + timedelta(days=7)
            ),
            ProgressHistory(
                assignment_id=asgn1.id,
                reporting_period="Week 2",
                progress_percentage=65,
                comments="Completed Virtual Warehouses and Security modules.",
                submitted_by="Alex Morgan",
                timestamp=now - timedelta(days=1)
            ),

            # David Chen history
            ProgressHistory(
                assignment_id=asgn2.id,
                reporting_period="Week 1",
                progress_percentage=50,
                comments="Halfway through practice sets.",
                submitted_by="David Chen",
                timestamp=now - timedelta(days=30)
            ),
            ProgressHistory(
                assignment_id=asgn2.id,
                reporting_period="Week 2",
                progress_percentage=100,
                comments="Finished full syllabus and scheduled exam.",
                submitted_by="David Chen",
                timestamp=now - timedelta(days=15)
            ),

            # Elena Rostova history (stalled progress showing why marked On Risk)
            ProgressHistory(
                assignment_id=asgn3.id,
                reporting_period="Week 1",
                progress_percentage=25,
                comments="Covered Foundation Models intro.",
                submitted_by="Elena Rostova",
                timestamp=two_weeks_ago + timedelta(days=7)
            ),
            ProgressHistory(
                assignment_id=asgn3.id,
                reporting_period="Week 2",
                progress_percentage=25,
                comments="No new modules completed due to sprint deadlines.",
                submitted_by="Elena Rostova",
                timestamp=now - timedelta(days=1)
            )
        ]
        db.add_all(history_records)

        # ---------------------------------------------------------
        # 5. Audit Log (Section 3.2 & 5.4: Administrative change audit)
        # ---------------------------------------------------------
        audit_sample = AuditLog(
            assignment_id=asgn3.id,
            administrator_id="HR001",
            administrator_name="Sarah Jenkins",
            field_name="admin_status",
            original_value="In Progress",
            updated_value="On Risk",
            reason="Progress remained flat at 25% for two weeks with exam scheduled in under a week. Followed up with employee.",
            timestamp=now - timedelta(hours=5)
        )
        db.add(audit_sample)

        db.commit()
        print("Database successfully seeded with realistic sample records!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        if close_db_at_end:
            db.close()

if __name__ == "__main__":
    seed_database()
