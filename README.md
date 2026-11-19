# Employee Course Progress Management System

A centralized system for employee learning progress, course assignments, examination tracking, and certification records designed to replace manual Excel-based tracking.

---

## Architecture Overview

This project includes **two implementations demonstrated in a single unified interface**:

1. **🏢 Zoho-Native Solution:**
   * Embedded inside the Zoho People / Zoho Creator ecosystem.
   * Seamless pre-authenticated context (no separate login page).
   * Direct employee self-service progress update forms and HR administration grid.

2. **🌐 External Web Dashboard:**
   * Modern corporate full-stack web application.
   * Standalone authentication (supporting Company SSO / Role selection between Employee and HR Admin).
   * Dedicated Employee Portal (KPI cards, progress bars, Track My Progress modal).
   * Dedicated HR Admin Portal (KPI overview, On-Risk alert monitoring, duplicate course assignment prevention, mandatory audit-logged modifications, and Excel export).

---

## Technology Stack

* **Backend:** Python 3.12 + FastAPI + SQLite (SQLAlchemy ORM) + Pydantic v2 + Pandas & Openpyxl.
* **Frontend:** Vanilla HTML5, CSS3, and Modular Modern JavaScript (ES6 Modules) with zero npm build dependencies.
* **Database:** SQLite (stored at `backend/progress_tracker.db`), easily swappable for production PostgreSQL.

---

## How to Run

### Step 1: Start the Backend Server

From the project root directory, run:

```bash
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```

### Step 2: Open the Application in your Browser

Simply open your browser and navigate to:

👉 **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)**

*(Or alternatively, you can directly open `frontend/index.html` in Chrome/Edge)*

---

## Demo Features to Test

### 1. Toggle Switcher (Top Bar)
* Click **"Zoho Preview"** to view the Zoho-native interface.
* Click **"External Dashboard"** to view the standalone corporate web application.

### 2. External Dashboard Authentication
* Use the quick 1-click test personas on the login page:
  * **Alex Morgan (`EMP101`)**: Employee in Data Engineering (In Progress on `COF-C03`).
  * **David Chen (`EMP102`)**: Employee in Cloud Architecture (Completed & Certified on `COF-C03`).
  * **Elena Rostova (`EMP103`)**: Employee in AI/ML (Stalled at 25% with exam scheduled in 5 days &bull; **⚠️ On Risk**).
  * **Sarah Jenkins (`HR001`)**: HR Administrator with full administrative controls.

### 3. Employee Portal
* Click **"Track My Progress"**.
* Select a course and update progress.
* Notice business rule enforcement:
  * *Not Started* locks progress to `0%`.
  * *In Progress* requires `1%` to `99%`.
  * *Completed* automatically locks progress to `100%`.
* Submissions automatically record submission timestamps and append to `progress_history`.

### 4. HR Admin Portal
* **On-Risk Monitoring:** Review employees flagged as "On Risk".
* **Assign Course:** Assign a new course to an employee. Notice that assigning a course already assigned to that employee is automatically blocked with duplicate prevention.
* **Verify & Edit Record:** Modify progress or dates. Notice that providing a **Modification Reason** is mandatory, and every change is recorded in the **Audit History Trail** with old value, new value, admin identity, and timestamp.
* **Export to Excel:** Click **"Export to Excel"** to download an `.xlsx` spreadsheet matching the original schema (retaining Week 1 and Week 2 columns).
