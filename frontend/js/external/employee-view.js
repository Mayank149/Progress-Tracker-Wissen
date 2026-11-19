/**
 * =========================================================
 * EXTERNAL EMPLOYEE VIEW MODULE
 * frontend/js/external/employee-view.js
 * Implements Section 4: Employee Dashboard & Progress Form
 * =========================================================
 */

import ApiService from "../api.js";
import { store } from "../state.js";

export class ExternalEmployeeView {
    static async render(container, user) {
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">My Learning & Certifications</h1>
                    <p style="font-size: 0.85rem; color: var(--neutral-500); margin-top: 2px;">
                        Manage your course milestones, examination schedules, and weekly progress.
                    </p>
                </div>
                <div class="page-actions">
                    <button id="btn-open-track-modal" class="btn btn-primary">
                        <span>📝</span>
                        <span>Track My Progress</span>
                    </button>
                </div>
            </div>

            <!-- Stats Overview (Section 4.1) -->
            <div class="stats-grid" id="emp-stats-container">
                <div class="stat-card">
                    <span class="stat-label">Total Assigned</span>
                    <span class="stat-value" id="stat-total-assigned">--</span>
                    <span class="stat-meta">Mandatory & Electives</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">In Progress</span>
                    <span class="stat-value" id="stat-in-progress" style="color: var(--primary);">--</span>
                    <span class="stat-meta">Active coursework</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Not Started</span>
                    <span class="stat-value" id="stat-not-started" style="color: var(--neutral-500);">--</span>
                    <span class="stat-meta">Pending kickoff</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Completed Courses</span>
                    <span class="stat-value" id="stat-completed" style="color: var(--success);">--</span>
                    <span class="stat-meta">100% curriculum done</span>
                </div>
                <div class="stat-card cert-highlight">
                    <span class="stat-label">Certified</span>
                    <span class="stat-value" id="stat-certified" style="color: #4338ca;">--</span>
                    <span class="stat-meta">Official exams passed</span>
                </div>
            </div>

            <!-- Assigned Courses Table (Section 4.2) -->
            <div class="card-container">
                <div class="card-header-bar">
                    <h2 class="card-header-title">My Assigned Courses</h2>
                    <span style="font-size: 0.8rem; color: var(--neutral-500);">Reflects latest assignments by HR</span>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Course Code</th>
                                <th>Course Title</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th>Planned Exam</th>
                                <th>Certified Date</th>
                                <th>Latest Notes</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="emp-courses-tbody">
                            <tr><td colspan="8" style="text-align: center; padding: 2rem;">Loading courses...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal Container for Progress Updates -->
            <div id="track-modal-container"></div>
        `;

        await this.loadData(container, user);
        this.attachListeners(container, user);
    }

    static async loadData(container, user) {
        try {
            const [stats, courses] = await Promise.all([
                ApiService.getEmployeeDashboard(user.employee_id),
                ApiService.getAssignedCourses(user.employee_id)
            ]);

            // Update stats
            container.querySelector("#stat-total-assigned").textContent = stats.total_assigned;
            container.querySelector("#stat-in-progress").textContent = stats.in_progress;
            container.querySelector("#stat-not-started").textContent = stats.not_started;
            container.querySelector("#stat-completed").textContent = stats.completed;
            container.querySelector("#stat-certified").textContent = stats.certified;

            // Render table
            const tbody = container.querySelector("#emp-courses-tbody");
            if (courses.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--neutral-500);">No courses currently assigned by HR.</td></tr>`;
                return;
            }

            tbody.innerHTML = courses.map(a => {
                const statusClass = a.course_status.toLowerCase().replace(" ", "-");
                const isComplete = a.course_status === "Completed";
                
                return `
                    <tr>
                        <td><strong>${a.course ? a.course.course_code : 'N/A'}</strong></td>
                        <td>
                            <div style="font-weight: 500;">${a.course ? a.course.course_name : ''}</div>
                            <div style="font-size: 0.72rem; color: var(--neutral-500);">${a.certification_name || ''}</div>
                        </td>
                        <td>
                            <span class="status-pill ${statusClass}">${a.course_status}</span>
                            ${a.admin_status === 'On Risk' ? '<span class="status-pill on-risk" style="margin-left: 4px;">⚠️ On Risk</span>' : ''}
                        </td>
                        <td>
                            <div class="progress-bar-wrapper">
                                <div class="progress-track">
                                    <div class="progress-fill ${isComplete ? 'completed' : ''}" style="width: ${a.progress_percentage}%;"></div>
                                </div>
                                <span class="progress-text">${a.progress_percentage}%</span>
                            </div>
                        </td>
                        <td>${a.exam_date || '<span style="color: var(--neutral-400);">Not set</span>'}</td>
                        <td>${a.certified_date || '<span style="color: var(--neutral-400);">-</span>'}</td>
                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${a.latest_comments || ''}">
                            ${a.latest_comments || '<span style="color: var(--neutral-400);">None</span>'}
                        </td>
                        <td>
                            <button class="btn btn-outline btn-sm btn-update-course" data-assignment-id="${a.id}">
                                Update
                            </button>
                        </td>
                    </tr>
                `;
            }).join("");

            // Attach inline update buttons
            tbody.querySelectorAll(".btn-update-course").forEach(btn => {
                btn.addEventListener("click", () => {
                    const asgnId = parseInt(btn.getAttribute("data-assignment-id"));
                    const asgn = courses.find(c => c.id === asgnId);
                    this.openProgressModal(container, user, courses, asgn);
                });
            });

        } catch (err) {
            store.showToast("Failed to load employee records", "error");
        }
    }

    static attachListeners(container, user) {
        const btnOpen = container.querySelector("#btn-open-track-modal");
        btnOpen.addEventListener("click", async () => {
            const courses = await ApiService.getAssignedCourses(user.employee_id);
            this.openProgressModal(container, user, courses, courses[0] || null);
        });
    }

    /**
     * Section 4.3, 4.4, 4.5: Course Progress Update Form Modal
     */
    static openProgressModal(container, user, courses, selectedAssignment) {
        const modalContainer = container.querySelector("#track-modal-container");
        if (courses.length === 0) {
            store.showToast("No courses assigned to update.", "info");
            return;
        }

        const current = selectedAssignment || courses[0];

        modalContainer.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3 class="modal-title">Track My Course Progress</h3>
                        <button type="button" class="modal-close-btn" id="modal-close-btn">&times;</button>
                    </div>
                    <form id="progress-update-form">
                        <div class="modal-body">
                            <!-- Course Selector (Section 4.2) -->
                            <div class="form-group">
                                <label class="form-label" for="form-assignment-id">Select Assigned Course <span class="required">*</span></label>
                                <select id="form-assignment-id" class="form-select" required>
                                    ${courses.map(c => `
                                        <option value="${c.id}" ${c.id === current.id ? 'selected' : ''}>
                                            ${c.course.course_code} - ${c.course.course_name} (Current: ${c.progress_percentage}%)
                                        </option>
                                    `).join("")}
                                </select>
                            </div>

                            <!-- Course Status (Section 4.3 & 4.4) -->
                            <div class="form-group">
                                <label class="form-label" for="form-course-status">Course Status <span class="required">*</span></label>
                                <select id="form-course-status" class="form-select" required>
                                    <option value="Not Started" ${current.course_status === 'Not Started' ? 'selected' : ''}>Not Started (0%)</option>
                                    <option value="In Progress" ${current.course_status === 'In Progress' ? 'selected' : ''}>In Progress (1% - 99%)</option>
                                    <option value="Completed" ${current.course_status === 'Completed' ? 'selected' : ''}>Completed (100%)</option>
                                </select>
                            </div>

                            <!-- Progress Percentage Input (Section 4.4 Rules) -->
                            <div class="form-group">
                                <label class="form-label" for="form-progress-pct">
                                    Current Progress Percentage (%) <span class="required">*</span>
                                </label>
                                <input 
                                    type="number" 
                                    id="form-progress-pct" 
                                    class="form-input" 
                                    min="0" 
                                    max="100" 
                                    value="${current.progress_percentage}" 
                                    required 
                                />
                                <div class="form-hint" id="progress-hint-text">
                                    In Progress: Allowed range is 1% to 99%.
                                </div>
                            </div>

                            <!-- Reporting Period (Section 6.3) -->
                            <div class="form-group">
                                <label class="form-label" for="form-period">Reporting Period Label</label>
                                <input 
                                    type="text" 
                                    id="form-period" 
                                    class="form-input" 
                                    placeholder="e.g. Week 3 or Final Exam Prep" 
                                    value="Week ${(current.progress_history ? current.progress_history.length : 0) + 1}"
                                />
                            </div>

                            <!-- Dates (Section 4.3) -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div class="form-group">
                                    <label class="form-label" for="form-exam-date">Planned Exam Date</label>
                                    <input 
                                        type="date" 
                                        id="form-exam-date" 
                                        class="form-input" 
                                        value="${current.exam_date || ''}" 
                                    />
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="form-cert-date">Certified Date</label>
                                    <input 
                                        type="date" 
                                        id="form-cert-date" 
                                        class="form-input" 
                                        value="${current.certified_date || ''}" 
                                    />
                                </div>
                            </div>

                            <!-- Comments -->
                            <div class="form-group">
                                <label class="form-label" for="form-comments">Weekly Update / Comments</label>
                                <textarea 
                                    id="form-comments" 
                                    class="form-textarea" 
                                    rows="3" 
                                    placeholder="Mention modules covered, practice test scores, or blockers..."
                                >${current.latest_comments || ''}</textarea>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" id="modal-cancel-btn">Cancel</button>
                            <button type="submit" class="btn btn-primary">Submit Progress</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Wire dynamic validation when status changes
        const statusSelect = modalContainer.querySelector("#form-course-status");
        const pctInput = modalContainer.querySelector("#form-progress-pct");
        const hintText = modalContainer.querySelector("#progress-hint-text");

        const syncPercentageRules = () => {
            const st = statusSelect.value;
            if (st === "Not Started") {
                pctInput.value = 0;
                pctInput.disabled = true;
                hintText.textContent = "Status is 'Not Started' - progress automatically locked at 0%.";
            } else if (st === "Completed") {
                pctInput.value = 100;
                pctInput.disabled = true;
                hintText.textContent = "Status is 'Completed' - progress automatically locked at 100%.";
            } else {
                pctInput.disabled = false;
                if (parseInt(pctInput.value) <= 0 || parseInt(pctInput.value) >= 100) {
                    pctInput.value = 50;
                }
                hintText.textContent = "Status is 'In Progress' - enter progress between 1% and 99%.";
            }
        };

        statusSelect.addEventListener("change", syncPercentageRules);
        syncPercentageRules();

        // Close handlers
        const closeModal = () => { modalContainer.innerHTML = ""; };
        modalContainer.querySelector("#modal-close-btn").addEventListener("click", closeModal);
        modalContainer.querySelector("#modal-cancel-btn").addEventListener("click", closeModal);

        // Submit handler
        const form = modalContainer.querySelector("#progress-update-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const asgnId = parseInt(modalContainer.querySelector("#form-assignment-id").value);
            const statusVal = statusSelect.value;
            const pctVal = parseInt(pctInput.value);
            const periodVal = modalContainer.querySelector("#form-period").value.trim();
            const examVal = modalContainer.querySelector("#form-exam-date").value || null;
            const certVal = modalContainer.querySelector("#form-cert-date").value || null;
            const commentsVal = modalContainer.querySelector("#form-comments").value.trim() || null;

            try {
                await ApiService.submitProgress({
                    assignment_id: asgnId,
                    course_status: statusVal,
                    progress_percentage: pctVal,
                    reporting_period: periodVal || "Weekly Update",
                    exam_date: examVal,
                    certified_date: certVal,
                    comments: commentsVal
                }, user.employee_id);

                store.showToast("Course progress submitted successfully!", "success");
                closeModal();
                await this.loadData(container, user);
            } catch (err) {
                store.showToast(err.message, "error");
            }
        });
    }
}
