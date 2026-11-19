/**
 * =========================================================
 * ZOHO NATIVE PREVIEW MODULE
 * frontend/js/zoho/zoho-view.js
 * Implements Section 2.1 & 12.1: Native Zoho People / Creator
 * Simulation (Pre-authenticated context, Zoho design tokens)
 * =========================================================
 */

import ApiService from "../api.js";
import { store } from "../state.js";

export class ZohoPreview {
    static async render(container) {
        const { zohoActiveEmployee, zohoActiveTab } = store.getState();

        container.innerHTML = `
            <!-- 1. Zoho Global Suite Header (No separate login page) -->
            <div class="zoho-suite-header">
                <div class="zoho-suite-left">
                    <div class="zoho-logo-badge">
                        <span class="zoho-red">Z</span><span class="zoho-green">O</span><span class="zoho-blue">H</span><span class="zoho-yellow">O</span>
                        <span style="color: #ffffff; margin-left: 2px;">One</span>
                    </div>
                    <span class="zoho-app-title">Zoho People • Learning & Development</span>
                </div>

                <div class="zoho-suite-right">
                    <div class="zoho-user-profile">
                        <div class="zoho-user-avatar" id="zoho-avatar">--</div>
                        <div>
                            <select id="zoho-persona-switcher" style="background: rgba(255, 255, 255, 0.15); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 4px; padding: 2px 6px; font-size: 0.78rem; font-family: inherit;">
                                <option value="EMP101">Alex Morgan (Data Eng)</option>
                                <option value="EMP102">David Chen (Cloud Arch)</option>
                                <option value="EMP103">Elena Rostova (AI/ML - On Risk)</option>
                                <option value="EMP104">Marcus Vance (Software Eng)</option>
                                <option value="HR001">Sarah Jenkins (HR Admin)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. Zoho Navigation Tabs -->
            <div class="zoho-module-nav">
                <div class="zoho-nav-tabs">
                    <button class="zoho-tab-link ${zohoActiveTab === 'employee' ? 'active' : ''}" id="zoho-tab-emp">
                        <span>👤</span> Self-Service: My Course Progress
                    </button>
                    <button class="zoho-tab-link ${zohoActiveTab === 'admin' ? 'active' : ''}" id="zoho-tab-admin">
                        <span>🏢</span> HR Admin: Training & Certification Grid
                    </button>
                </div>
                <div style="font-size: 0.75rem; color: #718096;">
                    Zoho People v8.4.2 • Embedded Native Form
                </div>
            </div>

            <!-- 3. Zoho Content Workspace -->
            <div class="zoho-body-container" id="zoho-content-area">
                <!-- Dynamically loaded based on active Zoho tab -->
            </div>
        `;

        this.attachHeaderListeners(container);
        await this.renderZohoTab(container);
    }

    static attachHeaderListeners(container) {
        const personaSelect = container.querySelector("#zoho-persona-switcher");
        personaSelect.value = store.getState().zohoActiveEmployee;

        personaSelect.addEventListener("change", async (e) => {
            store.setState({ zohoActiveEmployee: e.target.value });
            store.showToast(`Switched active Zoho employee to ${e.target.value}`, "info");
            await this.renderZohoTab(container);
        });

        const tabEmp = container.querySelector("#zoho-tab-emp");
        const tabAdmin = container.querySelector("#zoho-tab-admin");

        tabEmp.addEventListener("click", async () => {
            tabEmp.classList.add("active");
            tabAdmin.classList.remove("active");
            store.setState({ zohoActiveTab: "employee" });
            await this.renderZohoTab(container);
        });

        tabAdmin.addEventListener("click", async () => {
            tabAdmin.classList.add("active");
            tabEmp.classList.remove("active");
            store.setState({ zohoActiveTab: "admin" });
            await this.renderZohoTab(container);
        });
    }

    static async renderZohoTab(container) {
        const { zohoActiveTab, zohoActiveEmployee } = store.getState();
        const contentArea = container.querySelector("#zoho-content-area");

        if (zohoActiveTab === "employee") {
            await this.renderZohoEmployeeSelfService(contentArea, zohoActiveEmployee);
        } else {
            await this.renderZohoAdminGrid(contentArea);
        }
    }

    /**
     * Zoho Employee Self-Service Form (Section 2.1)
     */
    static async renderZohoEmployeeSelfService(container, empId) {
        container.innerHTML = `<div style="text-align: center; padding: 2rem;">Loading Zoho self-service portal...</div>`;

        try {
            const [stats, courses] = await Promise.all([
                ApiService.getEmployeeDashboard(empId),
                ApiService.getAssignedCourses(empId)
            ]);

            const activeAsgn = courses[0] || null;

            container.innerHTML = `
                <div style="flex: 1;">
                    <!-- Native Info Banner -->
                    <div class="zoho-banner">
                        <div class="zoho-banner-content">
                            <span class="zoho-banner-icon">ℹ️</span>
                            <div>
                                <strong>Logged in as ${stats.name} (${stats.employee_id})</strong> &mdash; ${stats.email}<br>
                                In the Zoho native model, course tracking is accessed directly within Zoho People without separate login credentials.
                            </div>
                        </div>
                    </div>

                    <!-- Zoho Form Panel: Course Progress Update -->
                    <div class="zoho-panel">
                        <div class="zoho-panel-header">
                            <h3 class="zoho-panel-title">Track My Course Progress (Zoho Creator Form)</h3>
                            <span style="font-size: 0.75rem; color: #718096;">All updates sync to centralized database</span>
                        </div>
                        <div class="zoho-panel-body">
                            ${!activeAsgn ? `
                                <div style="text-align: center; color: #718096; padding: 2rem;">
                                    No courses assigned to your employee profile yet.
                                </div>
                            ` : `
                                <form id="zoho-progress-form">
                                    <div class="zoho-form-grid">
                                        <div class="form-group">
                                            <label class="form-label">Course Name</label>
                                            <select id="zoho-select-asgn" class="form-select">
                                                ${courses.map(c => `
                                                    <option value="${c.id}" ${c.id === activeAsgn.id ? 'selected' : ''}>
                                                        ${c.course.course_code} - ${c.course.course_name}
                                                    </option>
                                                `).join("")}
                                            </select>
                                        </div>

                                        <div class="form-group">
                                            <label class="form-label">Course Status</label>
                                            <select id="zoho-select-status" class="form-select">
                                                <option value="Not Started" ${activeAsgn.course_status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                                                <option value="In Progress" ${activeAsgn.course_status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                                <option value="Completed" ${activeAsgn.course_status === 'Completed' ? 'selected' : ''}>Completed</option>
                                            </select>
                                        </div>

                                        <div class="form-group">
                                            <label class="form-label">Progress Percentage (%)</label>
                                            <input type="number" id="zoho-input-pct" class="form-input" min="0" max="100" value="${activeAsgn.progress_percentage}" />
                                        </div>

                                        <div class="form-group">
                                            <label class="form-label">Planned Exam Date</label>
                                            <input type="date" id="zoho-input-exam" class="form-input" value="${activeAsgn.exam_date || ''}" />
                                        </div>
                                    </div>

                                    <div class="form-group" style="margin-top: 1rem;">
                                        <label class="form-label">Weekly Progress Notes</label>
                                        <textarea id="zoho-input-comments" class="form-textarea" rows="2" placeholder="Enter progress notes for HR review...">${activeAsgn.latest_comments || ''}</textarea>
                                    </div>

                                    <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
                                        <button type="submit" class="zoho-btn-submit">Save Progress Update</button>
                                    </div>
                                </form>
                            `}
                        </div>
                    </div>

                    <!-- Enrolled Courses Overview -->
                    <div class="zoho-panel">
                        <div class="zoho-panel-header">
                            <h3 class="zoho-panel-title">My Registered Course Modules</h3>
                        </div>
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Course Name</th>
                                        <th>Progress</th>
                                        <th>Status</th>
                                        <th>HR Assessment</th>
                                        <th>Planned Exam</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${courses.map(c => `
                                        <tr>
                                            <td><strong>${c.course ? c.course.course_code : ''}</strong></td>
                                            <td>${c.course ? c.course.course_name : ''}</td>
                                            <td><strong>${c.progress_percentage}%</strong></td>
                                            <td><span class="zoho-badge in-progress">${c.course_status}</span></td>
                                            <td>
                                                <span class="zoho-badge ${c.admin_status === 'On Risk' ? 'on-risk' : 'completed'}">
                                                    ${c.admin_status}
                                                </span>
                                            </td>
                                            <td>${c.exam_date || 'Pending'}</td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            // Handle submission from Zoho native form
            const form = container.querySelector("#zoho-progress-form");
            if (form) {
                form.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const asgnId = parseInt(container.querySelector("#zoho-select-asgn").value);
                    const statusVal = container.querySelector("#zoho-select-status").value;
                    const pctVal = parseInt(container.querySelector("#zoho-input-pct").value);
                    const examVal = container.querySelector("#zoho-input-exam").value || null;
                    const notesVal = container.querySelector("#zoho-input-comments").value.trim() || null;

                    try {
                        await ApiService.submitProgress({
                            assignment_id: asgnId,
                            course_status: statusVal,
                            progress_percentage: pctVal,
                            exam_date: examVal,
                            comments: notesVal
                        }, empId);

                        store.showToast("Progress successfully saved via Zoho Form!", "success");
                        await this.renderZohoEmployeeSelfService(container, empId);
                    } catch (err) {
                        store.showToast(err.message, "error");
                    }
                });
            }

        } catch (err) {
            container.innerHTML = `<div style="color: var(--danger); padding: 2rem;">Error loading Zoho data. Please check backend connection.</div>`;
        }
    }

    /**
     * Zoho Admin Training Records Grid (Section 2.1)
     */
    static async renderZohoAdminGrid(container) {
        container.innerHTML = `<div style="text-align: center; padding: 2rem;">Loading Zoho Admin Records...</div>`;

        try {
            const [stats, assignments] = await Promise.all([
                ApiService.getAdminDashboard(),
                ApiService.getAdminAssignments()
            ]);

            container.innerHTML = `
                <div style="flex: 1;">
                    <!-- Admin Header Card -->
                    <div class="zoho-banner" style="border-left-color: #2e7d32; background: #f1f8e9; color: #1b5e20;">
                        <div class="zoho-banner-content">
                            <span class="zoho-banner-icon">📋</span>
                            <div>
                                <strong>HR Centralized View (Zoho People Grid)</strong><br>
                                Total enrolled: ${stats.total_assignments} assignments &bull; ${stats.on_risk} On-Risk alerts &bull; ${stats.certified} Certified
                            </div>
                        </div>
                    </div>

                    <div class="zoho-panel">
                        <div class="zoho-panel-header">
                            <h3 class="zoho-panel-title">Employee Training Progress Summary</h3>
                            <button id="zoho-btn-excel" class="btn btn-outline btn-sm">Download Spreadsheet (.xlsx)</button>
                        </div>
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Employee ID</th>
                                        <th>Employee Name</th>
                                        <th>Course</th>
                                        <th>Progress</th>
                                        <th>Course Status</th>
                                        <th>Admin Status</th>
                                        <th>Planned Exam</th>
                                        <th>Week 1</th>
                                        <th>Week 2</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${assignments.map(a => {
                                        let w1 = "-";
                                        let w2 = "-";
                                        if (a.progress_history) {
                                            for (const h of a.progress_history) {
                                                if (h.reporting_period.toLowerCase().includes("week 1") && w1 === "-") w1 = `${h.progress_percentage}%`;
                                                if (h.reporting_period.toLowerCase().includes("week 2") && w2 === "-") w2 = `${h.progress_percentage}%`;
                                            }
                                        }

                                        return `
                                            <tr>
                                                <td><code>${a.employee ? a.employee.employee_id : ''}</code></td>
                                                <td><strong>${a.employee ? a.employee.name : ''}</strong></td>
                                                <td>${a.course ? a.course.course_code : ''}</td>
                                                <td><strong>${a.progress_percentage}%</strong></td>
                                                <td><span class="zoho-badge in-progress">${a.course_status}</span></td>
                                                <td>
                                                    <span class="zoho-badge ${a.admin_status === 'On Risk' ? 'on-risk' : (a.admin_status === 'Certified' ? 'completed' : 'in-progress')}">
                                                        ${a.admin_status}
                                                    </span>
                                                </td>
                                                <td>${a.exam_date || 'Not set'}</td>
                                                <td>${w1}</td>
                                                <td>${w2}</td>
                                            </tr>
                                        `;
                                    }).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            container.querySelector("#zoho-btn-excel").addEventListener("click", () => {
                window.location.href = ApiService.getExcelExportUrl();
            });

        } catch (err) {
            container.innerHTML = `<div style="color: var(--danger); padding: 2rem;">Error loading Zoho Admin records.</div>`;
        }
    }
}
