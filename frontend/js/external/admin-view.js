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

                <!-- Table 1: Course Enrollments -->
                <div id="section-enrollments" class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Course</th>
                                <th>Progress %</th>
                                <th>Course Status</th>
                                <th>HR Status</th>
                                <th>Exam Date</th>
                                <th>Certified Date</th>
                                <th>Week 1</th>
                                <th>Week 2</th>
                                <th>Actions</th>
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
                                <th>Timestamp</th>
                                <th>Admin Identity</th>
                                <th>Assignment ID</th>
                                <th>Field Modified</th>
                                <th>Original Value</th>
                                <th>Updated Value</th>
                                <th>Modification Reason</th>
                            </tr>
                        </thead>
                        <tbody id="admin-audit-tbody">
                            <tr><td colspan="7" style="text-align: center; padding: 2rem;">Loading audit trail...</td></tr>
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

            tbody.innerHTML = assignments.map(a => {
                const statusClass = a.course_status.toLowerCase().replace(" ", "-");
                const adminStatusClass = a.admin_status.toLowerCase().replace(" ", "-");
                
                // Extract Week 1 & Week 2
                let w1 = "-";
                let w2 = "-";
                if (a.progress_history) {
                    const sorted = [...a.progress_history].sort((x, y) => new Date(x.timestamp) - new Date(y.timestamp));
                    for (const h of sorted) {
                        if (h.reporting_period.toLowerCase().includes("week 1") && w1 === "-") w1 = `${h.progress_percentage}%`;
                        if (h.reporting_period.toLowerCase().includes("week 2") && w2 === "-") w2 = `${h.progress_percentage}%`;
                    }
                }

                return `
                    <tr>
                        <td>
                            <strong>${a.employee ? a.employee.name : 'N/A'}</strong>
                            <div style="font-size: 0.72rem; color: var(--neutral-500);">${a.employee ? a.employee.employee_id : ''} • ${a.employee ? a.employee.email : ''}</div>
                        </td>
                        <td>
                            <strong>${a.course ? a.course.course_code : ''}</strong>
                            <div style="font-size: 0.72rem; color: var(--neutral-500);">${a.course ? a.course.course_name : ''}</div>
                        </td>
                        <td>
                            <div class="progress-bar-wrapper">
                                <div class="progress-track" style="width: 80px;">
                                    <div class="progress-fill ${a.course_status === 'Completed' ? 'completed' : ''}" style="width: ${a.progress_percentage}%;"></div>
                                </div>
                                <span class="progress-text">${a.progress_percentage}%</span>
                            </div>
                        </td>
                        <td><span class="status-pill ${statusClass}">${a.course_status}</span></td>
                        <td><span class="status-pill ${adminStatusClass}">${a.admin_status}</span></td>
                        <td>${a.exam_date || '<span style="color: var(--neutral-400);">-</span>'}</td>
                        <td>${a.certified_date || '<span style="color: var(--neutral-400);">-</span>'}</td>
                        <td>${w1}</td>
                        <td>${w2}</td>
                        <td>
                            <button class="btn btn-outline btn-sm btn-edit-asgn" data-id="${a.id}">
                                ✏️ Verify / Edit
                            </button>
                        </td>
                    </tr>
                `;
            }).join("");

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
            if (logs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--neutral-500);">No administrative changes recorded yet.</td></tr>`;
                return;
            }

            tbody.innerHTML = logs.map(l => `
                <tr>
                    <td style="font-size: 0.78rem; color: var(--neutral-600);">${new Date(l.timestamp).toLocaleString()}</td>
                    <td><strong>${l.administrator_name}</strong> <span style="font-size: 0.72rem; color: var(--neutral-500);">(${l.administrator_id})</span></td>
                    <td>#${l.assignment_id}</td>
                    <td><code>${l.field_name}</code></td>
                    <td><span style="color: var(--neutral-500); text-decoration: line-through;">${l.original_value || 'None'}</span></td>
                    <td><strong style="color: var(--primary);">${l.updated_value || 'None'}</strong></td>
                    <td style="max-width: 250px; font-size: 0.8rem; color: var(--neutral-700);">${l.reason || ''}</td>
                </tr>
            `).join("");
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
