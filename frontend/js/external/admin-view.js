/**
 * =========================================================
 * EXTERNAL ADMIN VIEW MODULE
 * frontend/js/external/admin-view.js
 * Implements Section 5: Admin Dashboard, Course Assignment,
 * Audit Logs & Excel Export
 * =========================================================
 */

import ApiService from "../api.js";
import { store } from "../state.js";

export class ExternalAdminView {
    static async render(container, user) {
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">HR & Admin Management Portal</h1>
                    <p style="font-size: 0.85rem; color: var(--neutral-500); margin-top: 2px;">
                        Organization-wide learning progress, assignment controls, audit trail, and exports.
                    </p>
                </div>
                <div class="page-actions">
                    <button id="btn-export-excel" class="btn btn-outline">
                        <span>📊</span>
                        <span>Export to Excel</span>
                    </button>
                    <button id="btn-open-assign-modal" class="btn btn-primary">
                        <span>➕</span>
                        <span>Assign New Course</span>
                    </button>
                </div>
            </div>

            <!-- Admin Overview Metrics (Section 5.1) -->
            <div class="stats-grid" id="admin-stats-container">
                <div class="stat-card">
                    <span class="stat-label">Total Employees</span>
                    <span class="stat-value" id="admin-stat-employees">--</span>
                    <span class="stat-meta">Active learners</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Total Assignments</span>
                    <span class="stat-value" id="admin-stat-assignments">--</span>
                    <span class="stat-meta">Enrolled courses</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">In Progress</span>
                    <span class="stat-value" id="admin-stat-inprogress" style="color: var(--primary);">--</span>
                    <span class="stat-meta">Active coursework</span>
                </div>
                <div class="stat-card risk-alert">
                    <span class="stat-label" style="color: #b91c1c;">⚠️ On Risk</span>
                    <span class="stat-value" id="admin-stat-onrisk" style="color: #b91c1c;">--</span>
                    <span class="stat-meta" style="color: #dc2626;">Stalled or close exam date</span>
                </div>
                <div class="stat-card cert-highlight">
                    <span class="stat-label" style="color: #15803d;">Certified</span>
                    <span class="stat-value" id="admin-stat-certified" style="color: #15803d;">--</span>
                    <span class="stat-meta">Passed certifications</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Upcoming Exams</span>
                    <span class="stat-value" id="admin-stat-exams" style="color: #b45309;">--</span>
                    <span class="stat-meta">Scheduled within 30 days</span>
                </div>
            </div>

            <!-- Tabbed Views: Assignments vs Audit Logs -->
            <div class="card-container">
                <div class="card-header-bar">
                    <div style="display: flex; gap: 8px;">
                        <button id="tab-btn-assignments" class="btn btn-sm btn-primary">Course Enrollments</button>
                        <button id="tab-btn-audit" class="btn btn-sm btn-outline">Audit History Trail</button>
                    </div>

                    <!-- Search & Filter Controls (Section 5.5) -->
                    <div class="filter-bar" id="admin-filter-bar">
                        <select id="filter-admin-status" class="form-select" style="width: 140px; padding: 0.45rem;">
                            <option value="">All HR Status</option>
                            <option value="In Progress">In Progress</option>
                            <option value="On Risk">On Risk</option>
                            <option value="Certified">Certified</option>
                        </select>
                        <select id="filter-course-status" class="form-select" style="width: 140px; padding: 0.45rem;">
                            <option value="">All Progress</option>
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </select>
                        <input 
                            type="text" 
                            id="search-input" 
                            class="search-input" 
                            placeholder="Search employee or course..." 
                        />
                    </div>
                </div>

                <!-- Table 1: Course Enrollments (Grouped by unique employee with course dropdown) -->
                <div id="section-enrollments" class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th style="min-width: 230px;">Course (Select Course)</th>
                                <th>Progress %</th>
                                <th>Course Status</th>
                                <th>HR Status</th>
                                <th>Exam Date</th>
                                <th>Certified Date</th>
                                <th>Week 1</th>
                                <th>Week 2</th>
                                <th style="text-align: center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="admin-assignments-tbody">
                            <tr><td colspan="10" style="text-align: center; padding: 2rem;">Loading enrollment records...</td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- Table 2: Audit Logs (Section 3.2 & 5.4) -->
                <div id="section-audit" class="table-responsive hidden">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width: 170px;">Timestamp</th>
                                <th style="width: 160px;">Admin Identity</th>
                                <th style="width: 110px;">Assignment</th>
                                <th>Changes Recorded</th>
                                <th>Modification Reason</th>
                            </tr>
                        </thead>
                        <tbody id="admin-audit-tbody">
                            <tr><td colspan="5" style="text-align: center; padding: 2rem;">Loading audit trail...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modals Container -->
            <div id="admin-modal-container"></div>
        `;

        await this.loadDashboardStats(container);
        await this.loadAssignments(container);
        this.attachListeners(container, user);
    }

    static async loadDashboardStats(container) {
        try {
            const stats = await ApiService.getAdminDashboard();
            container.querySelector("#admin-stat-employees").textContent = stats.total_employees;
            container.querySelector("#admin-stat-assignments").textContent = stats.total_assignments;
            container.querySelector("#admin-stat-inprogress").textContent = stats.in_progress;
            container.querySelector("#admin-stat-onrisk").textContent = stats.on_risk;
            container.querySelector("#admin-stat-certified").textContent = stats.certified;
            container.querySelector("#admin-stat-exams").textContent = stats.upcoming_exams_count;
        } catch (err) {
            store.showToast("Failed to load dashboard metrics", "error");
        }
    }

    static async loadAssignments(container) {
        const adminStatus = container.querySelector("#filter-admin-status").value;
        const courseStatus = container.querySelector("#filter-course-status").value;
        const search = container.querySelector("#search-input").value.trim();

        try {
            const assignments = await ApiService.getAdminAssignments({
                admin_status: adminStatus || undefined,
                course_status: courseStatus || undefined,
                search: search || undefined
            });

            const tbody = container.querySelector("#admin-assignments-tbody");
            if (assignments.length === 0) {
                tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 2rem; color: var(--neutral-500);">No matching course records found.</td></tr>`;
                return;
            }

            // Group assignments by unique employee so an employee is listed once (not in multiple rows)
            const employeeMap = new Map();
            for (const a of assignments) {
                const empId = a.employee ? a.employee.employee_id : "UNKNOWN";
                if (!employeeMap.has(empId)) {
                    employeeMap.set(empId, {
                        employee: a.employee,
                        assignments: []
                    });
                }
                employeeMap.get(empId).assignments.push(a);
            }

            const uniqueEmployees = Array.from(employeeMap.values());

            tbody.innerHTML = uniqueEmployees.map(empData => {
                const emp = empData.employee;
                const empId = emp ? emp.employee_id : "";
                const firstAsgn = empData.assignments[0];

                return `
                    <tr id="ext-row-emp-${empId}" data-emp-id="${empId}">
                        <td>
                            <strong>${emp ? emp.name : 'N/A'}</strong>
                            <div style="font-size: 0.72rem; color: var(--neutral-500);">${empId} • ${emp ? emp.email : ''}</div>
                        </td>
                        <td>
                            <select class="ext-table-course-select form-select" data-emp-id="${empId}" style="width: 100%; max-width: 260px; padding: 4px 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer;">
                                ${empData.assignments.map(a => `
                                    <option value="${a.id}" ${a.id === firstAsgn.id ? 'selected' : ''}>
                                        ${a.course ? a.course.course_code : 'Course'} - ${a.course ? a.course.course_name : a.certification_name} (${a.progress_percentage}%)
                                    </option>
                                `).join("")}
                            </select>
                        </td>
                        <td class="ext-cell-progress">
                            <!-- Filled dynamically -->
                        </td>
                        <td class="ext-cell-course-status">
                            <!-- Filled dynamically -->
                        </td>
                        <td class="ext-cell-admin-status">
                            <!-- Filled dynamically -->
                        </td>
                        <td class="ext-cell-exam-date">
                            <!-- Filled dynamically -->
                        </td>
                        <td class="ext-cell-cert-date">
                            <!-- Filled dynamically -->
                        </td>
                        <td class="ext-cell-week-1">
                            <!-- Filled dynamically -->
                        </td>
                        <td class="ext-cell-week-2">
                            <!-- Filled dynamically -->
                        </td>
                        <td style="text-align: center;">
                            <button class="btn btn-outline btn-sm btn-edit-asgn" data-id="${firstAsgn.id}" data-emp-id="${empId}">
                                ✏️ Verify / Edit
                            </button>
                        </td>
                    </tr>
                `;
            }).join("");

            // Helper to update a row's details for a given assignment
            const updateRowForAssignment = (rowEl, asgn) => {
                if (!rowEl || !asgn) return;

                // Update the Verify/Edit button's target assignment id
                const btnEdit = rowEl.querySelector(".btn-edit-asgn");
                if (btnEdit) {
                    btnEdit.setAttribute("data-id", asgn.id);
                }

                // 1. Progress
                const cellProgress = rowEl.querySelector(".ext-cell-progress");
                if (cellProgress) {
                    const isComplete = asgn.course_status === "Completed";
                    cellProgress.innerHTML = `
                        <div class="progress-bar-wrapper">
                            <div class="progress-track" style="width: 80px;">
                                <div class="progress-fill ${isComplete ? 'completed' : ''}" style="width: ${asgn.progress_percentage || 0}%;"></div>
                            </div>
                            <span class="progress-text">${asgn.progress_percentage || 0}%</span>
                        </div>
                    `;
                }

                // 2. Course Status
                const cellCourseStatus = rowEl.querySelector(".ext-cell-course-status");
                if (cellCourseStatus) {
                    const st = asgn.course_status || "Not Started";
                    cellCourseStatus.innerHTML = `
                        <span class="status-pill ${st.toLowerCase().replace(' ', '-')}">${st}</span>
                    `;
                }

                // 3. Admin Status
                const cellAdminStatus = rowEl.querySelector(".ext-cell-admin-status");
                if (cellAdminStatus) {
                    const ast = asgn.admin_status || "In Progress";
                    const badgeClass = ast === "On Risk" ? "on-risk" : (ast === "Certified" ? "certified" : "in-progress");
                    cellAdminStatus.innerHTML = `
                        <span class="status-pill ${badgeClass}">
                            ${ast === "On Risk" ? '⚠️ ' : ''}${ast}
                        </span>
                    `;
                }

                // 4. Planned Exam
                const cellExam = rowEl.querySelector(".ext-cell-exam-date");
                if (cellExam) {
                    cellExam.innerHTML = asgn.exam_date ? asgn.exam_date : `<span style="color: var(--neutral-400);">-</span>`;
                }

                // 5. Certified Date
                const cellCert = rowEl.querySelector(".ext-cell-cert-date");
                if (cellCert) {
                    cellCert.innerHTML = asgn.certified_date ? asgn.certified_date : `<span style="color: var(--neutral-400);">-</span>`;
                }

                // 6. Week 1 and Week 2
                let w1 = "-";
                let w2 = "-";
                if (asgn.progress_history) {
                    for (const h of asgn.progress_history) {
                        if (h.reporting_period && h.reporting_period.toLowerCase().includes("week 1") && w1 === "-") {
                            w1 = `${h.progress_percentage}%`;
                        }
                        if (h.reporting_period && h.reporting_period.toLowerCase().includes("week 2") && w2 === "-") {
                            w2 = `${h.progress_percentage}%`;
                        }
                    }
                }
                const cellW1 = rowEl.querySelector(".ext-cell-week-1");
                if (cellW1) cellW1.textContent = w1;

                const cellW2 = rowEl.querySelector(".ext-cell-week-2");
                if (cellW2) cellW2.textContent = w2;
            };

            // Initialize each unique employee row with their first course
            uniqueEmployees.forEach(empData => {
                const empId = empData.employee ? empData.employee.employee_id : "";
                const row = container.querySelector(`#ext-row-emp-${empId}`);
                if (row && empData.assignments.length > 0) {
                    updateRowForAssignment(row, empData.assignments[0]);
                }
            });

            // Listen for course selection changes within each employee row
            const courseSelects = container.querySelectorAll(".ext-table-course-select");
            courseSelects.forEach(sel => {
                sel.addEventListener("change", (e) => {
                    const selectedAsgnId = parseInt(e.target.value);
                    const empId = sel.getAttribute("data-emp-id");
                    const empData = employeeMap.get(empId);
                    if (empData) {
                        const asgn = empData.assignments.find(a => a.id === selectedAsgnId);
                        const row = container.querySelector(`#ext-row-emp-${empId}`);
                        if (asgn && row) {
                            updateRowForAssignment(row, asgn);
                        }
                    }
                });
            });

            // Attach inline edit handlers
            tbody.querySelectorAll(".btn-edit-asgn").forEach(btn => {
                btn.addEventListener("click", () => {
                    const id = parseInt(btn.getAttribute("data-id"));
                    const asgn = assignments.find(x => x.id === id);
                    const currentUser = store.getState().currentUser;
                    this.openEditModal(container, asgn, currentUser);
                });
            });

        } catch (err) {
            store.showToast("Failed to fetch assignment list", "error");
        }
    }

    static async loadAuditLogs(container) {
        try {
            const logs = await ApiService.getAuditLogs();
            const tbody = container.querySelector("#admin-audit-tbody");
            if (!logs || logs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--neutral-500);">No administrative changes recorded yet.</td></tr>`;
                return;
            }

            // Group audit logs by update event (same assignment, admin, reason, and close timestamp)
            const groups = [];
            for (const log of logs) {
                const tsStr = (log.timestamp || "").replace(" ", "T");
                const timeMs = new Date(tsStr).getTime();
                let existing = groups.find(g => 
                    g.assignment_id === log.assignment_id &&
                    g.administrator_id === log.administrator_id &&
                    g.reason === log.reason &&
                    (g.timestamp === log.timestamp || (!isNaN(timeMs) && !isNaN(g.timeMs) && Math.abs(g.timeMs - timeMs) < 10000))
                );
                if (!existing) {
                    existing = {
                        timeMs,
                        timestamp: log.timestamp,
                        administrator_name: log.administrator_name,
                        administrator_id: log.administrator_id,
                        assignment_id: log.assignment_id,
                        reason: log.reason,
                        changes: []
                    };
                    groups.push(existing);
                }
                existing.changes.push({
                    field_name: log.field_name,
                    original_value: log.original_value,
                    updated_value: log.updated_value
                });
            }

            tbody.innerHTML = groups.map(g => {
                const changesHtml = g.changes.map(c => {
                    const orig = (c.original_value !== null && c.original_value !== undefined && c.original_value !== '') ? c.original_value : 'None';
                    const upd = (c.updated_value !== null && c.updated_value !== undefined && c.updated_value !== '') ? c.updated_value : 'None';
                    const origDisplay = c.field_name === 'progress_percentage' ? `${orig}%` : orig;
                    const updDisplay = c.field_name === 'progress_percentage' ? `${upd}%` : upd;

                    return `
                        <div style="margin-bottom: 5px; font-size: 0.82rem; line-height: 1.4;">
                            <span style="font-family: monospace; font-size: 0.76rem; background: var(--neutral-100); color: var(--neutral-800); padding: 2px 6px; border-radius: 4px; font-weight: 600;">${c.field_name}</span>: 
                            <span style="color: var(--neutral-400); text-decoration: line-through; margin-left: 4px;">${origDisplay}</span>
                            <span style="color: var(--neutral-500); margin: 0 4px;">&rarr;</span>
                            <strong style="color: var(--primary);">${updDisplay}</strong>
                        </div>
                    `;
                }).join("");

                return `
                    <tr>
                        <td style="font-size: 0.8rem; color: var(--neutral-600); white-space: nowrap; vertical-align: top;">
                            ${new Date(g.timestamp).toLocaleString()}
                        </td>
                        <td style="vertical-align: top;">
                            <strong>${g.administrator_name}</strong>
                            <span style="font-size: 0.72rem; color: var(--neutral-500); display: block;">(${g.administrator_id})</span>
                        </td>
                        <td style="vertical-align: top;">
                            <code>#${g.assignment_id}</code>
                        </td>
                        <td style="vertical-align: top;">
                            ${changesHtml}
                        </td>
                        <td style="max-width: 250px; font-size: 0.82rem; color: var(--neutral-700); vertical-align: top;">
                            ${g.reason || '-'}
                        </td>
                    </tr>
                `;
            }).join("");
        } catch (err) {
            store.showToast("Failed to load audit logs", "error");
        }
    }

    static attachListeners(container, user) {
        // Tab switching
        const tabBtnAsgn = container.querySelector("#tab-btn-assignments");
        const tabBtnAudit = container.querySelector("#tab-btn-audit");
        const secAsgn = container.querySelector("#section-enrollments");
        const secAudit = container.querySelector("#section-audit");
        const filterBar = container.querySelector("#admin-filter-bar");

        tabBtnAsgn.addEventListener("click", () => {
            tabBtnAsgn.className = "btn btn-sm btn-primary";
            tabBtnAudit.className = "btn btn-sm btn-outline";
            secAsgn.classList.remove("hidden");
            secAudit.classList.add("hidden");
            filterBar.style.display = "flex";
            this.loadAssignments(container);
        });

        tabBtnAudit.addEventListener("click", () => {
            tabBtnAudit.className = "btn btn-sm btn-primary";
            tabBtnAsgn.className = "btn btn-sm btn-outline";
            secAsgn.classList.add("hidden");
            secAudit.classList.remove("hidden");
            filterBar.style.display = "none";
            this.loadAuditLogs(container);
        });

        // Search & Filter change events
        const filterAdmin = container.querySelector("#filter-admin-status");
        const filterCourse = container.querySelector("#filter-course-status");
        const searchInput = container.querySelector("#search-input");

        filterAdmin.addEventListener("change", () => this.loadAssignments(container));
        filterCourse.addEventListener("change", () => this.loadAssignments(container));
        searchInput.addEventListener("input", () => this.loadAssignments(container));

        // Excel Export Button (Section 5.6)
        container.querySelector("#btn-export-excel").addEventListener("click", () => {
            window.location.href = ApiService.getExcelExportUrl();
            store.showToast("Exporting Excel file matching existing spreadsheet schema...", "info");
        });

        // Assign Course Button
        container.querySelector("#btn-open-assign-modal").addEventListener("click", () => {
            this.openAssignModal(container, user);
        });
    }

    /**
     * Section 5.3: Course Assignment with Duplicate Prevention
     */
    static async openAssignModal(container, adminUser) {
        const modalContainer = container.querySelector("#admin-modal-container");
        const [employees, courses] = await Promise.all([
            ApiService.getAdminEmployees(),
            ApiService.getMasterCourses()
        ]);

        modalContainer.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3 class="modal-title">Assign Course to Employee</h3>
                        <button type="button" class="modal-close-btn" id="modal-close-btn">&times;</button>
                    </div>
                    <form id="assign-course-form">
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label" for="assign-emp-id">Select Employee <span class="required">*</span></label>
                                <select id="assign-emp-id" class="form-select" required>
                                    <option value="">-- Choose Employee --</option>
                                    ${employees.map(e => `
                                        <option value="${e.id}">${e.name} (${e.employee_id}) - ${e.department || 'Engineering'}</option>
                                    `).join("")}
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="assign-course-id">Select Course <span class="required">*</span></label>
                                <select id="assign-course-id" class="form-select" required>
                                    <option value="">-- Choose Course --</option>
                                    ${courses.map(c => `
                                        <option value="${c.id}">${c.course_code} - ${c.course_name}</option>
                                    `).join("")}
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="assign-exam-date">Target Planned Exam Date</label>
                                <input type="date" id="assign-exam-date" class="form-input" />
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="assign-admin-status">Initial Admin Status</label>
                                <select id="assign-admin-status" class="form-select">
                                    <option value="In Progress" selected>In Progress</option>
                                    <option value="On Risk">On Risk</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" id="modal-cancel-btn">Cancel</button>
                            <button type="submit" class="btn btn-primary">Confirm Assignment</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const closeModal = () => { modalContainer.innerHTML = ""; };
        modalContainer.querySelector("#modal-close-btn").addEventListener("click", closeModal);
        modalContainer.querySelector("#modal-cancel-btn").addEventListener("click", closeModal);

        const form = modalContainer.querySelector("#assign-course-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const empId = parseInt(modalContainer.querySelector("#assign-emp-id").value);
            const crsId = parseInt(modalContainer.querySelector("#assign-course-id").value);
            const examVal = modalContainer.querySelector("#assign-exam-date").value || null;
            const adminStatusVal = modalContainer.querySelector("#assign-admin-status").value;

            try {
                await ApiService.assignCourse({
                    employee_id: empId,
                    course_id: crsId,
                    exam_date: examVal,
                    admin_status: adminStatusVal
                });

                store.showToast("Course successfully assigned!", "success");
                closeModal();
                await this.loadDashboardStats(container);
                await this.loadAssignments(container);
            } catch (err) {
                // Catches duplicate assignment error directly from backend
                store.showToast(err.message, "error");
            }
        });
    }

    /**
     * Section 3.2 & 5.4: Administrative Progress Modification with Mandatory Audit Logging
     */
    static openEditModal(container, assignment, adminUser) {
        const modalContainer = container.querySelector("#admin-modal-container");

        modalContainer.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-card">
                    <div class="modal-header">
                        <div>
                            <h3 class="modal-title">Administrative Verification & Modification</h3>
                            <div style="font-size: 0.75rem; color: var(--neutral-500); margin-top: 2px;">
                                Editing: ${assignment.employee.name} (${assignment.course.course_code})
                            </div>
                        </div>
                        <button type="button" class="modal-close-btn" id="modal-close-btn">&times;</button>
                    </div>
                    <form id="admin-modify-form">
                        <div class="modal-body">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div class="form-group">
                                    <label class="form-label" for="edit-course-status">Course Progress Status</label>
                                    <select id="edit-course-status" class="form-select">
                                        <option value="Not Started" ${assignment.course_status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                                        <option value="In Progress" ${assignment.course_status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                        <option value="Completed" ${assignment.course_status === 'Completed' ? 'selected' : ''}>Completed</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="edit-progress-pct">Progress Percentage (%)</label>
                                    <input type="number" id="edit-progress-pct" class="form-input" min="0" max="100" value="${assignment.progress_percentage}" />
                                </div>
                            </div>

                            <!-- Overall Administrative Status (Section 7.2) -->
                            <div class="form-group">
                                <label class="form-label" for="edit-admin-status">Overall Administrative Status</label>
                                <select id="edit-admin-status" class="form-select">
                                    <option value="In Progress" ${assignment.admin_status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="On Risk" ${assignment.admin_status === 'On Risk' ? 'selected' : ''}>⚠️ On Risk (Needs attention)</option>
                                    <option value="Certified" ${assignment.admin_status === 'Certified' ? 'selected' : ''}>Certified</option>
                                </select>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div class="form-group">
                                    <label class="form-label" for="edit-exam-date">Planned Exam Date</label>
                                    <input type="date" id="edit-exam-date" class="form-input" value="${assignment.exam_date || ''}" />
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="edit-cert-date">Certified Date</label>
                                    <input type="date" id="edit-cert-date" class="form-input" value="${assignment.certified_date || ''}" />
                                </div>
                            </div>

                            <!-- Mandatory Audit Rationale (Section 3.2 & 5.4) -->
                            <div class="form-group" style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <label class="form-label" for="edit-audit-reason" style="color: #0f172a;">
                                    Modification Reason & Audit Note <span class="required">*</span>
                                </label>
                                <textarea 
                                    id="edit-audit-reason" 
                                    class="form-textarea" 
                                    rows="2" 
                                    placeholder="Explain why this administrative change is being recorded..." 
                                    required
                                ></textarea>
                                <div class="form-hint">
                                    Audited under Admin: <strong>${adminUser.name} (${adminUser.employee_id})</strong>
                                </div>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" id="modal-cancel-btn">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save & Audit Record</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const closeModal = () => { modalContainer.innerHTML = ""; };
        modalContainer.querySelector("#modal-close-btn").addEventListener("click", closeModal);
        modalContainer.querySelector("#modal-cancel-btn").addEventListener("click", closeModal);

        const form = modalContainer.querySelector("#admin-modify-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const reason = modalContainer.querySelector("#edit-audit-reason").value.trim();
            if (!reason) {
                store.showToast("Please provide a reason for the audit trail.", "error");
                return;
            }

            try {
                await ApiService.modifyAssignment(assignment.id, {
                    course_status: modalContainer.querySelector("#edit-course-status").value,
                    progress_percentage: parseInt(modalContainer.querySelector("#edit-progress-pct").value),
                    admin_status: modalContainer.querySelector("#edit-admin-status").value,
                    exam_date: modalContainer.querySelector("#edit-exam-date").value || null,
                    certified_date: modalContainer.querySelector("#edit-cert-date").value || null,
                    administrator_id: adminUser.employee_id,
                    administrator_name: adminUser.name,
                    reason: reason
                });

                store.showToast("Assignment record updated and logged to audit trail!", "success");
                closeModal();
                await this.loadDashboardStats(container);
                await this.loadAssignments(container);
            } catch (err) {
                store.showToast(err.message, "error");
            }
        });
    }
}
