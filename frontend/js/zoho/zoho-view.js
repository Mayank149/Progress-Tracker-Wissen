/**
 * =========================================================
 * ZOHO NATIVE PREVIEW MODULE
 * frontend/js/zoho/zoho-view.js
 * Pixel-perfect implementation of Zoho People / Creator
 * matching the attached enterprise screenshot specification.
 * Supports exclusive HR Centralized View access control and
 * multi-certification live progress updates synced with backend.
 * =========================================================
 */

import ApiService from "../api.js";
import { store } from "../state.js";

export class ZohoPreview {
    static timerInterval = null;
    static timerSeconds = 0;
    static isCheckedIn = false;

    static async render(container) {
        const { zohoActiveEmployee, zohoActiveTab } = store.getState();
        const isHrAdmin = zohoActiveEmployee === "HR001";

        container.innerHTML = `
            <div class="zoho-container" style="display: flex; flex-direction: column; min-height: 100vh;">
                <!-- 1. TOP GLOBAL SUITE BAR -->
                <header class="zoho-top-bar">
                    <div class="zoho-top-left">
                        <!-- Zoho 4-petal Logo SVG -->
                        <div class="zoho-logo-icon" title="Zoho One Ecosystem">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="5.5" r="3.8" fill="#e53935" />
                                <circle cx="18.5" cy="12" r="3.8" fill="#43a047" />
                                <circle cx="12" cy="18.5" r="3.8" fill="#fbc02d" />
                                <circle cx="5.5" cy="12" r="3.8" fill="#1e88e5" />
                            </svg>
                        </div>

                        <!-- Top Navigation Tabs -->
                        <nav class="zoho-top-nav">
                            <button class="zoho-top-tab active" data-top-tab="my-space">My Space</button>
                            <button class="zoho-top-tab" data-top-tab="team">Team</button>
                            <button class="zoho-top-tab" data-top-tab="organization">Organization</button>
                        </nav>
                    </div>

                    <div class="zoho-top-right">
                        <!-- Blue Plus Button -->
                        <button class="zoho-btn-quick-add" title="Quick Add">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>

                        <!-- Search Icon -->
                        <button class="zoho-top-icon-btn" title="Search">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>

                        <!-- Notification Bell with Dot -->
                        <button class="zoho-top-icon-btn" title="Notifications" style="position: relative;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            <span style="position: absolute; top: 4px; right: 5px; width: 6px; height: 6px; background: #ef4444; border-radius: 50%;"></span>
                        </button>

                        <!-- User Avatar (Red circular avatar from attached pic) & Persona Switcher -->
                        <div class="zoho-user-avatar-wrap">
                            <div class="zoho-user-avatar-circle" id="zoho-top-avatar" title="Active Employee Profile">
                                ${isHrAdmin ? 'SJ' : 'AM'}
                            </div>
                            <select id="zoho-persona-switcher" class="zoho-persona-select" title="Switch Simulated Zoho Employee">
                                <option value="EMP101">Alex Morgan (Intern / Data Eng)</option>
                                <option value="EMP102">David Chen (Cloud Arch)</option>
                                <option value="EMP103">Elena Rostova (AI/ML - On Risk)</option>
                                <option value="EMP104">Marcus Vance (Software Eng)</option>
                                <option value="HR001">Sarah Jenkins (HR Admin - Exclusive)</option>
                            </select>
                        </div>
                    </div>
                </header>

                <!-- 2. SUB-HEADER HORIZONTAL BAR (Overview, Dashboard, Calendar) -->
                <div class="zoho-sub-header">
                    <div class="zoho-sub-tabs">
                        <button class="zoho-sub-tab ${zohoActiveTab !== 'admin' ? 'active' : ''}" id="zoho-sub-overview">Overview</button>
                        ${isHrAdmin ? `
                            <button class="zoho-sub-tab ${zohoActiveTab === 'admin' ? 'active' : ''}" id="zoho-sub-dashboard" title="HR Centralized Training Grid">Dashboard</button>
                        ` : ''}
                        <button class="zoho-sub-tab" id="zoho-sub-calendar">Calendar</button>
                    </div>
                    <div class="zoho-sub-actions">
                        <button class="zoho-sub-action-btn" title="Export / Print">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                <rect x="6" y="14" width="12" height="8"></rect>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- 3. MIDDLE BODY LAYOUT (Left Sidebar + Content) -->
                <div class="zoho-main-layout">
                    <!-- Vertical Left Sidebar -->
                    <aside class="zoho-sidebar">
                        <div class="zoho-sidebar-top">
                            <!-- Home (Active item with blue icon background) -->
                            <button class="zoho-sidebar-item active" data-nav="home" title="Home">
                                <div class="zoho-sidebar-icon-wrap active-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                                    </svg>
                                </div>
                                <span class="zoho-sidebar-label">Home</span>
                            </button>

                            <!-- Leave Tracker -->
                            <button class="zoho-sidebar-item" data-nav="leave-tracker" title="Leave Tracker">
                                <div class="zoho-sidebar-icon-wrap">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 2a10 10 0 0 1 10 10c0 4.5-5 8-10 8S2 16.5 2 12a10 10 0 0 1 10-10z"></path>
                                        <line x1="12" y1="2" x2="12" y2="22"></line>
                                    </svg>
                                </div>
                                <span class="zoho-sidebar-label">Leave Tracker</span>
                            </button>

                            <!-- Timesheet -->
                            <button class="zoho-sidebar-item" data-nav="timesheet" title="Timesheet">
                                <div class="zoho-sidebar-icon-wrap">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </div>
                                <span class="zoho-sidebar-label">Timesheet</span>
                            </button>

                            <!-- Holiday Ma... -->
                            <button class="zoho-sidebar-item" data-nav="holiday" title="Holiday Ma...">
                                <div class="zoho-sidebar-icon-wrap">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                </div>
                                <span class="zoho-sidebar-label">Holiday Ma...</span>
                            </button>

                            <!-- Performance -->
                            <button class="zoho-sidebar-item" data-nav="performance" title="Performance">
                                <div class="zoho-sidebar-icon-wrap">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"></path>
                                        <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"></path>
                                        <path d="M4 22h16"></path>
                                        <path d="M10 14.66V17c0 .55-.45 1-1 1H7a1 1 0 0 0-1 1v2c0 .55.45 1 1 1h10a1 1 0 0 0 1-1v-2c0-.55-.45-1-1-1h-2a1 1 0 0 1-1-1v-2.34"></path>
                                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path>
                                    </svg>
                                </div>
                                <span class="zoho-sidebar-label">Performance</span>
                            </button>

                            <!-- Files -->
                            <button class="zoho-sidebar-item" data-nav="files" title="Files">
                                <div class="zoho-sidebar-icon-wrap">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                </div>
                                <span class="zoho-sidebar-label">Files</span>
                            </button>

                            <!-- LMS -->
                            <button class="zoho-sidebar-item" data-nav="lms" id="zoho-nav-lms" title="Learning Management System">
                                <div class="zoho-sidebar-icon-wrap">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                        <line x1="8" y1="21" x2="16" y2="21"></line>
                                        <line x1="12" y1="17" x2="12" y2="21"></line>
                                    </svg>
                                </div>
                                <span class="zoho-sidebar-label">LMS</span>
                            </button>

                            <!-- More -->
                            <button class="zoho-sidebar-item" data-nav="more" title="More Options">
                                <div class="zoho-sidebar-icon-wrap">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <circle cx="12" cy="12" r="2"></circle>
                                        <circle cx="19" cy="12" r="2"></circle>
                                        <circle cx="5" cy="12" r="2"></circle>
                                    </svg>
                                </div>
                                <span class="zoho-sidebar-label">More</span>
                            </button>
                        </div>

                        <!-- Sidebar Bottom: Reports -->
                        <div class="zoho-sidebar-bottom">
                            <button class="zoho-sidebar-item" data-nav="reports" title="Reports">
                                <div class="zoho-sidebar-icon-wrap">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="12" x2="16" y2="8"></line>
                                    </svg>
                                </div>
                                <span class="zoho-sidebar-label">Reports</span>
                            </button>
                        </div>
                    </aside>

                    <!-- Main Dynamic Content Viewport -->
                    <div class="zoho-content-viewport" id="zoho-dynamic-viewport">
                        <!-- Dynamically filled with Activities or HR View -->
                    </div>
                </div>

                <!-- 4. BOTTOM DOCK / FOOTER BAR -->
                <footer class="zoho-bottom-dock">
                    <div class="zoho-dock-left">
                        <button class="zoho-dock-item" title="My Pins">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>My Pins</span>
                        </button>
                        <button class="zoho-dock-item" title="Chats">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>Chats</span>
                        </button>
                        <button class="zoho-dock-item" title="Contacts">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <span>Contacts</span>
                        </button>
                    </div>

                    <div class="zoho-dock-right">
                        <button class="zoho-dock-icon-btn" title="Announcements">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                        </button>
                        <button class="zoho-dock-icon-btn" title="Search">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                        <button class="zoho-dock-icon-btn" title="Help & System Info">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </button>
                        <button class="zoho-dock-icon-btn" title="Night / Day Mode">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                        </button>
                    </div>
                </footer>

                <!-- 5. PROGRESS UPDATE MODAL (ZOHO NATIVE DIALOG) -->
                <div id="zoho-progress-modal" class="zoho-modal-backdrop hidden">
                    <div class="zoho-modal-card">
                        <div class="zoho-modal-header">
                            <div class="zoho-modal-title" id="zoho-modal-title">Track Certification Progress</div>
                            <button class="zoho-modal-close-btn" id="zoho-modal-close">&times;</button>
                        </div>
                        <div class="zoho-modal-body">
                            <form id="zoho-modal-form">
                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label class="form-label" style="font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 4px; display: block;">Select Assigned Certification Course</label>
                                    <select id="modal-select-course" class="form-select" style="width: 100%; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; font-family: inherit;">
                                        <!-- Populated dynamically -->
                                    </select>
                                </div>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                                    <div class="form-group">
                                        <label class="form-label" style="font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 4px; display: block;">Course Status</label>
                                        <select id="modal-select-status" class="form-select" style="width: 100%; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; font-family: inherit;">
                                            <option value="Not Started">Not Started</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label" style="font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 4px; display: block;">Progress Percentage (%)</label>
                                        <input type="number" id="modal-input-pct" min="0" max="100" class="form-input" style="width: 100%; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; font-family: inherit;" />
                                    </div>
                                </div>

                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label class="form-label" style="font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 4px; display: block;">Planned Exam Date</label>
                                    <input type="date" id="modal-input-exam" class="form-input" style="width: 100%; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; font-family: inherit;" />
                                </div>

                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label class="form-label" style="font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 4px; display: block;">Weekly Progress Notes / Comments (Syncs to HR Centralized View)</label>
                                    <textarea id="modal-input-notes" rows="2" class="form-textarea" placeholder="Enter progress notes for HR and supervisor..." style="width: 100%; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; font-family: inherit; resize: vertical;"></textarea>
                                </div>

                                <div class="zoho-modal-footer">
                                    <button type="button" class="zoho-btn-cancel" id="zoho-modal-btn-cancel">Cancel</button>
                                    <button type="submit" class="zoho-btn-save" id="zoho-modal-btn-submit">Save Progress Update</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachGlobalListeners(container);
        await this.renderCurrentTab(container);
    }

    /**
     * Attaches Persona Switcher, Sub-tabs & Sidebar Listeners with Strict Access Control
     */
    static attachGlobalListeners(container) {
        const personaSelect = container.querySelector("#zoho-persona-switcher");
        personaSelect.value = store.getState().zohoActiveEmployee;

        personaSelect.addEventListener("change", async (e) => {
            const newEmpId = e.target.value;
            const isNowHr = newEmpId === "HR001";
            
            // If switching from HR to normal employee while on admin tab, switch back to activities
            if (!isNowHr && store.getState().zohoActiveTab === "admin") {
                store.setState({ zohoActiveTab: "activities" });
            }
            
            store.setState({ zohoActiveEmployee: newEmpId });
            store.showToast(`Switched active Zoho persona to ${newEmpId} (${isNowHr ? 'HR Administrator' : 'Employee'})`, "info");
            
            // Re-render shell to sync navigation labels and access permissions
            await this.render(container);
        });

        // Sub-tabs: Overview vs Dashboard (Dashboard rendered exclusively for HR)
        const subOverview = container.querySelector("#zoho-sub-overview");
        const subDashboard = container.querySelector("#zoho-sub-dashboard");

        if (subOverview) {
            subOverview.addEventListener("click", async () => {
                if (store.getState().zohoActiveTab === "activities") return;
                subOverview.classList.add("active");
                if (subDashboard) subDashboard.classList.remove("active");
                store.setState({ zohoActiveTab: "activities" });
                await this.renderCurrentTab(container);
            });
        }

        if (subDashboard) {
            subDashboard.addEventListener("click", async () => {
                if (store.getState().zohoActiveTab === "admin") return;
                subDashboard.classList.add("active");
                if (subOverview) subOverview.classList.remove("active");
                store.setState({ zohoActiveTab: "admin" });
                await this.renderCurrentTab(container);
            });
        }

        // Left sidebar navigation: smoothly updates active icon with ZERO POPUPS and ZERO FLICKER
        const sidebarItems = container.querySelectorAll(".zoho-sidebar-item");
        sidebarItems.forEach(btn => {
            btn.addEventListener("click", async () => {
                const navTarget = btn.getAttribute("data-nav");
                const isHr = store.getState().zohoActiveEmployee === "HR001";

                // Update active sidebar icon visually without touching main viewport
                sidebarItems.forEach(i => {
                    i.classList.remove("active");
                    const iconWrap = i.querySelector(".zoho-sidebar-icon-wrap");
                    if (iconWrap) iconWrap.classList.remove("active-icon");
                });
                btn.classList.add("active");
                const currentIcon = btn.querySelector(".zoho-sidebar-icon-wrap");
                if (currentIcon) currentIcon.classList.add("active-icon");

                // If user clicks "home", smoothly return to activities if on admin tab
                if (navTarget === "home") {
                    if (store.getState().zohoActiveTab === "admin") {
                        store.setState({ zohoActiveTab: "activities" });
                        await this.renderCurrentTab(container);
                    }
                    return;
                }

                // If user clicks "lms" or "reports", only HR opens the centralized training grid
                if (navTarget === "lms" || navTarget === "reports") {
                    if (isHr && store.getState().zohoActiveTab !== "admin") {
                        store.setState({ zohoActiveTab: "admin" });
                        await this.renderCurrentTab(container);
                    }
                    // For employees: silent active icon toggle, no popups, no flicker
                    return;
                }

                // For Leave Tracker, Timesheet, Holiday Calendar, Performance, Files, More:
                // Silent active icon toggle with zero popups and zero flicker!
            });
        });

        // Modal close listeners
        const modal = container.querySelector("#zoho-progress-modal");
        const closeBtn = container.querySelector("#zoho-modal-close");
        const cancelBtn = container.querySelector("#zoho-modal-btn-cancel");

        const closeModal = () => modal.classList.add("hidden");
        if (closeBtn) closeBtn.addEventListener("click", closeModal);
        if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    /**
     * Renders either the exact Activities Dashboard or the HR Admin Training Grid (HR-Only)
     */
    static async renderCurrentTab(container) {
        const { zohoActiveTab, zohoActiveEmployee } = store.getState();
        const isHr = zohoActiveEmployee === "HR001";
        const viewport = container.querySelector("#zoho-dynamic-viewport");

        // Sync avatar circle in top bar
        const topAvatar = container.querySelector("#zoho-top-avatar");
        if (topAvatar) {
            topAvatar.textContent = isHr ? "SJ" : zohoActiveEmployee.slice(0, 2).toUpperCase();
        }

        if (zohoActiveTab === "admin") {
            // Strict role guard: if an employee tries to access admin view, quietly route to activities
            if (!isHr) {
                store.setState({ zohoActiveTab: "activities" });
                await this.renderZohoActivitiesDashboard(viewport, zohoActiveEmployee);
                return;
            }
            await this.renderZohoAdminGrid(viewport);
        } else {
            await this.renderZohoActivitiesDashboard(viewport, zohoActiveEmployee);
        }
    }

    /**
     * Exact visual replica of the attached picture
     */
    static async renderZohoActivitiesDashboard(viewport, empId) {
        viewport.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: #64748b;">
                <div style="font-size: 1.5rem; margin-bottom: 8px;">⏳</div>
                <div>Loading Zoho People Workspace...</div>
            </div>
        `;

        try {
            // Fetch live employee details, courses, and department colleagues
            const isHr = empId === "HR001";
            const [stats, courses, allUsers] = await Promise.all([
                ApiService.getEmployeeDashboard(empId).catch(() => ({
                    employee_id: empId,
                    name: isHr ? "Sarah Jenkins" : "Alex Morgan",
                    email: isHr ? "sarah.jenkins@wissen.com" : "alex.morgan@wissen.com",
                    department: isHr ? "Human Resources" : "Data Engineering"
                })),
                ApiService.getAssignedCourses(empId).catch(() => []),
                ApiService.getAvailableUsers().catch(() => [
                    { employee_id: "EMP101", name: "Alex Morgan", department: "Data Engineering" },
                    { employee_id: "EMP102", name: "David Chen", department: "Cloud Architecture" },
                    { employee_id: "EMP103", name: "Elena Rostova", department: "AI & Machine Learning" },
                    { employee_id: "EMP104", name: "Marcus Vance", department: "Software Engineering" },
                    { employee_id: "HR001", name: "Sarah Jenkins", role: "hr_admin", department: "Human Resources" }
                ])
            ]);

            // Filter out current employee to get colleagues
            const colleagues = allUsers.filter(u => u.employee_id !== empId && u.role !== 'hr_admin').slice(0, 3);
            const manager = allUsers.find(u => u.role === 'hr_admin') || { name: "Sarah Jenkins", role: "Reporting Manager" };

            // Employee initials & title
            const initials = stats.name.split(" ").map(n => n[0]).join("").toUpperCase();
            const firstName = stats.name.split(" ")[0];
            const designation = isHr ? "HR Administrator" : (empId === "EMP101" ? "Intern" : "Software Engineer");

            viewport.innerHTML = `
                <!-- Lush Green Tropical Foliage Banner -->
                <div class="zoho-foliage-banner">
                    <button class="zoho-banner-menu-btn" title="Options">
                        <span>&bull;&bull;&bull;</span>
                    </button>
                </div>

                <!-- Overlapping Two-Column Workspace -->
                <div class="zoho-dashboard-grid">
                    <!-- ================= LEFT COLUMN ================= -->
                    <div class="zoho-col-left">
                        <!-- Card 1: Profile & Check-in Card -->
                        <div class="zoho-card zoho-profile-card">
                            <div class="zoho-avatar-container">
                                <div class="zoho-emp-avatar" id="emp-card-avatar">${initials}</div>
                            </div>
                            <h3 class="zoho-emp-name" id="emp-card-name">${stats.name}</h3>
                            <p class="zoho-emp-designation" id="emp-card-role">${designation}</p>
                            <div class="zoho-checkin-status ${this.isCheckedIn ? 'checked-in' : ''}" id="emp-checkin-text">
                                ${this.isCheckedIn ? 'Checked in' : 'Yet to check-in'}
                            </div>
                            <div class="zoho-timer-badge" id="emp-timer-badge" title="Click to Check-in / Check-out">
                                <span id="emp-timer-display">${this.formatTimer(this.timerSeconds)}</span>
                            </div>
                        </div>

                        <!-- Card 2: Reporting Manager Card -->
                        <div class="zoho-card zoho-manager-card">
                            <div class="zoho-manager-avatar">SJ</div>
                            <div class="zoho-manager-info">
                                <div class="zoho-manager-name" title="${manager.name}">${manager.name}</div>
                                <div class="zoho-manager-title">Reporting Mana...</div>
                                <div class="zoho-manager-status">Yet to check-in</div>
                            </div>
                        </div>

                        <!-- Card 3: Department Members Card -->
                        <div class="zoho-card zoho-dept-card">
                            <h4 class="zoho-dept-title">Department Members</h4>
                            <div class="zoho-dept-list">
                                ${colleagues.map(colleague => {
                                    const colInitials = colleague.name.split(" ").map(p => p[0]).join("").toUpperCase();
                                    return `
                                        <div class="zoho-dept-item">
                                            <div class="zoho-dept-avatar">${colInitials}</div>
                                            <div class="zoho-dept-info">
                                                <div class="zoho-dept-name" title="${colleague.name}">${colleague.name}</div>
                                                <div class="zoho-dept-status">Yet to check-in</div>
                                            </div>
                                        </div>
                                    `;
                                }).join("")}
                            </div>
                            <div class="zoho-dept-more">
                                <a href="#" id="btn-dept-more">+2374 More</a>
                            </div>
                        </div>
                    </div>

                    <!-- ================= RIGHT COLUMN ================= -->
                    <div class="zoho-col-right">
                        <!-- Navigation Tabs Strip (Overlaps Banner) -->
                        <div class="zoho-card zoho-activities-tab-bar">
                            <div class="zoho-activity-tabs">
                                <button class="zoho-act-tab active" data-act-tab="activities">Activities</button>
                                <button class="zoho-act-tab" data-act-tab="feeds">Feeds</button>
                                <button class="zoho-act-tab" data-act-tab="profile">Profile</button>
                                ${isHr ? '<button class="zoho-act-tab" data-act-tab="approvals">Approvals</button>' : ''}
                                <button class="zoho-act-tab" data-act-tab="leave">Leave</button>
                                <button class="zoho-act-tab" data-act-tab="attendance">Attendance</button>
                                <button class="zoho-act-tab" data-act-tab="time-logs">Time Logs</button>
                                <button class="zoho-act-tab" data-act-tab="more">&bull;&bull;&bull;</button>
                            </div>
                            <div class="zoho-act-filter">
                                <button class="zoho-tune-btn" title="Filter & View Settings">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="4" y1="21" x2="4" y2="14"></line>
                                        <line x1="4" y1="10" x2="4" y2="3"></line>
                                        <line x1="12" y1="21" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12" y2="3"></line>
                                        <line x1="20" y1="21" x2="20" y2="16"></line>
                                        <line x1="20" y1="12" x2="20" y2="3"></line>
                                        <line x1="1" y1="14" x2="7" y2="14"></line>
                                        <line x1="9" y1="8" x2="15" y2="8"></line>
                                        <line x1="17" y1="16" x2="23" y2="16"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Greeting Card (Wissen Logo + Good Morning + Warm Sunrise Glow) -->
                        <div class="zoho-card zoho-greeting-card">
                            <div class="zoho-greeting-left">
                                <div class="zoho-wissen-badge">
                                    <div class="zoho-wissen-brand">
                                        <span class="wissen-text">wissen</span>
                                        <svg class="wissen-logo-svg" width="22" height="18" viewBox="0 0 24 18" fill="none">
                                            <path d="M2 3 L6 15 L9 6 L12 15 L16 3" stroke="#002b49" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M7 3 L11 13 L14 5 L17 13 L21 3" stroke="#0077cc" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                    <span class="wissen-sub">TECHNOLOGY</span>
                                </div>
                                <div class="zoho-greeting-text">
                                    <h2 class="zoho-greeting-title">Good Morning ${firstName}</h2>
                                    <p class="zoho-greeting-sub">Have a productive day!</p>
                                </div>
                            </div>
                            <div class="zoho-greeting-sun">
                                <div class="sun-ring ring-3"></div>
                                <div class="sun-ring ring-2"></div>
                                <div class="sun-ring ring-1"></div>
                                <div class="sun-core"></div>
                            </div>
                        </div>

                        <!-- HR Exclusive Shortcut Banner if logged in as Sarah Jenkins -->
                        ${isHr ? `
                            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 1.25rem;">🏢</span>
                                    <div>
                                        <strong style="color: #065f46; font-size: 0.85rem;">HR Administrator Mode (Sarah Jenkins)</strong>
                                        <div style="font-size: 0.74rem; color: #047857;">You have exclusive access to view organization-wide training records and export Excel spreadsheets.</div>
                                    </div>
                                </div>
                                <button id="btn-open-hr-grid-direct" style="background: #059669; color: #ffffff; border: none; padding: 5px 12px; border-radius: 4px; font-size: 0.76rem; font-weight: 600; cursor: pointer;">
                                    Open HR Centralized View &rarr;
                                </button>
                            </div>
                        ` : ''}

                        <!-- Activity / Course Session Cards List -->
                        <div class="zoho-activity-list" id="zoho-sessions-container">
                            <!-- 1. The exact upcoming session card from the attached screenshot -->
                            <div class="zoho-session-card">
                                <div class="zoho-session-left">
                                    <div class="zoho-session-icon">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                            <line x1="8" y1="21" x2="16" y2="21"></line>
                                            <line x1="12" y1="17" x2="12" y2="21"></line>
                                        </svg>
                                    </div>
                                    <div class="zoho-session-content">
                                        <div class="zoho-session-title">LangChain Day-4 ~ LangChain in Action: Build and Deploy Real-World GenAI Applications Batch - 4</div>
                                        <div class="zoho-session-subtitle">There is an upcoming session in the course you have been enrolled in</div>
                                    </div>
                                </div>
                                <div class="zoho-session-right">
                                    <span class="zoho-session-starts">Starts at</span>
                                    <span class="zoho-session-time">1:00 PM</span>
                                    <span class="zoho-session-date">(Asia/Kolkata), Nov 19</span>
                                </div>
                            </div>

                            <!-- 2. Assigned certification courses from backend database (Multiple courses per employee!) -->
                            ${courses.map(c => {
                                const statusClass = (c.course_status || "Not Started").toLowerCase().replace(" ", "-");
                                const isComplete = c.course_status === "Completed";
                                return `
                                    <div class="zoho-session-card">
                                        <div class="zoho-session-left">
                                            <div class="zoho-session-icon">
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                                    <line x1="8" y1="21" x2="16" y2="21"></line>
                                                    <line x1="12" y1="17" x2="12" y2="21"></line>
                                                </svg>
                                            </div>
                                            <div class="zoho-session-content">
                                                <div class="zoho-session-title">
                                                    ${c.course ? `${c.course.course_code} ~ ${c.course.course_name}` : (c.certification_name || 'Corporate Certification Course')}
                                                </div>
                                                <div class="zoho-session-subtitle">
                                                    ${c.course ? c.course.description : 'Official employee certification curriculum with weekly milestone tracking.'}
                                                </div>
                                                <div class="zoho-session-progress-row">
                                                    <div class="zoho-progress-mini-bar">
                                                        <div class="zoho-progress-mini-fill ${isComplete ? 'completed' : ''}" style="width: ${c.progress_percentage || 0}%;"></div>
                                                    </div>
                                                    <span style="font-size: 0.72rem; font-weight: 700; color: #1e293b;">${c.progress_percentage || 0}%</span>
                                                    <span class="zoho-session-meta-pill ${statusClass}">${c.course_status}</span>
                                                    ${c.admin_status === 'On Risk' ? '<span class="zoho-session-meta-pill on-risk">⚠️ On Risk</span>' : ''}
                                                    <button class="zoho-btn-track-action btn-open-course-modal" 
                                                        data-assignment-id="${c.id}" 
                                                        data-code="${c.course ? c.course.course_code : ''}" 
                                                        data-status="${c.course_status}" 
                                                        data-pct="${c.progress_percentage}" 
                                                        data-exam="${c.exam_date || ''}" 
                                                        data-notes="${c.latest_comments || ''}">
                                                        Update Progress
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="zoho-session-right">
                                            <span class="zoho-session-starts">Exam Target</span>
                                            <span class="zoho-session-time">${c.exam_date ? c.exam_date : 'Pending'}</span>
                                            <span class="zoho-session-date">Syncs to HR Grid</span>
                                        </div>
                                    </div>
                                `;
                            }).join("")}

                            <!-- 3. Additional batch session card matching the layout in the screenshot -->
                            <div class="zoho-session-card">
                                <div class="zoho-session-left">
                                    <div class="zoho-session-icon">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                            <line x1="8" y1="21" x2="16" y2="21"></line>
                                            <line x1="12" y1="17" x2="12" y2="21"></line>
                                        </svg>
                                    </div>
                                    <div class="zoho-session-content">
                                        <div class="zoho-session-title">LangChain Day-4 ~ LangChain in Action: Build and Deploy Real-World GenAI Applications Batch - 4</div>
                                        <div class="zoho-session-subtitle">There is an upcoming session in the course you have been enrolled in</div>
                                    </div>
                                </div>
                                <div class="zoho-session-right">
                                    <span class="zoho-session-starts">Starts at</span>
                                    <span class="zoho-session-time">1:00 PM</span>
                                    <span class="zoho-session-date">(Asia/Kolkata), Nov 19</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Setup Check-in / Timer Interactive Toggle
            this.setupCheckinTimer(viewport);

            // Setup Activity Tabs listeners with exclusive HR guard
            this.setupActivityTabs(viewport, isHr);

            // Setup Update Progress Modal listeners for all courses
            this.setupProgressModal(viewport, courses, empId);

            // Wire direct HR button if present
            const btnDirectHr = viewport.querySelector("#btn-open-hr-grid-direct");
            if (btnDirectHr) {
                btnDirectHr.addEventListener("click", () => {
                    store.setState({ zohoActiveTab: "admin" });
                    this.renderCurrentTab(document.getElementById("zoho-app-container"));
                });
            }

        } catch (err) {
            console.error("Error rendering Zoho Activities Dashboard:", err);
            viewport.innerHTML = `<div style="color: #ef4444; padding: 3rem; text-align: center;">Error loading Zoho data. Please check backend connection.</div>`;
        }
    }

    /**
     * Interactive Live Digital Check-in Timer (00 : 00 : 00)
     */
    static setupCheckinTimer(viewport) {
        const timerBadge = viewport.querySelector("#emp-timer-badge");
        const timerDisplay = viewport.querySelector("#emp-timer-display");
        const statusText = viewport.querySelector("#emp-checkin-text");

        if (!timerBadge) return;

        timerBadge.addEventListener("click", () => {
            this.isCheckedIn = !this.isCheckedIn;

            if (this.isCheckedIn) {
                statusText.textContent = "Checked in";
                statusText.classList.add("checked-in");
                store.showToast("Checked in successfully at Zoho People!", "success");

                if (!this.timerInterval) {
                    this.timerInterval = setInterval(() => {
                        this.timerSeconds++;
                        if (timerDisplay) {
                            timerDisplay.textContent = this.formatTimer(this.timerSeconds);
                        }
                    }, 1000);
                }
            } else {
                statusText.textContent = "Yet to check-in";
                statusText.classList.remove("checked-in");
                store.showToast("Checked out of Zoho People", "info");

                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                }
            }
        });
    }

    static formatTimer(totalSecs) {
        const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
        const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
        const secs = String(totalSecs % 60).padStart(2, '0');
        return `${hrs} : ${mins} : ${secs}`;
    }

    /**
     * Activity tab buttons with strict access control on Approvals
     */
    static setupActivityTabs(viewport, isHr) {
        const tabs = viewport.querySelectorAll(".zoho-act-tab");
        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const tabName = tab.getAttribute("data-act-tab");

                if (tabName === "approvals") {
                    if (isHr) {
                        store.setState({ zohoActiveTab: "admin" });
                        this.renderCurrentTab(document.getElementById("zoho-app-container"));
                    }
                    return;
                }

                tabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
            });
        });

        const moreLink = viewport.querySelector("#btn-dept-more");
        if (moreLink) {
            moreLink.addEventListener("click", (e) => {
                e.preventDefault();
                store.showToast("Viewing all 2,374 Wissen Technology organization members", "info");
            });
        }
    }

    /**
     * Progress Update Modal Wireup & Validation for Each Certification
     */
    static setupProgressModal(viewport, courses, empId) {
        const modal = document.querySelector("#zoho-progress-modal");
        const selectCourse = document.querySelector("#modal-select-course");
        const selectStatus = document.querySelector("#modal-select-status");
        const inputPct = document.querySelector("#modal-input-pct");
        const inputExam = document.querySelector("#modal-input-exam");
        const inputNotes = document.querySelector("#modal-input-notes");
        const form = document.querySelector("#zoho-modal-form");

        // Populate all employee's assigned courses in dropdown
        if (selectCourse && courses.length > 0) {
            selectCourse.innerHTML = courses.map(c => `
                <option value="${c.id}" data-status="${c.course_status}" data-pct="${c.progress_percentage}" data-exam="${c.exam_date || ''}" data-notes="${c.latest_comments || ''}">
                    ${c.course ? c.course.course_code : 'Course'} - ${c.course ? c.course.course_name : c.certification_name} (${c.progress_percentage}%)
                </option>
            `).join("");

            // When user changes course selection inside modal, update other fields
            selectCourse.addEventListener("change", (e) => {
                const selectedOpt = selectCourse.options[selectCourse.selectedIndex];
                if (selectedOpt) {
                    const st = selectedOpt.getAttribute("data-status") || "In Progress";
                    const pct = selectedOpt.getAttribute("data-pct") || "50";
                    const ex = selectedOpt.getAttribute("data-exam") || "";
                    const nt = selectedOpt.getAttribute("data-notes") || "";

                    selectStatus.value = st;
                    selectStatus.dispatchEvent(new Event("change"));
                    if (inputPct && st === "In Progress") inputPct.value = pct;
                    if (inputExam) inputExam.value = ex;
                    if (inputNotes) inputNotes.value = nt;
                }
            });
        }

        // Automatic business rules on status change
        if (selectStatus && inputPct) {
            selectStatus.addEventListener("change", (e) => {
                const val = e.target.value;
                if (val === "Not Started") {
                    inputPct.value = 0;
                    inputPct.disabled = true;
                } else if (val === "Completed") {
                    inputPct.value = 100;
                    inputPct.disabled = true;
                } else {
                    inputPct.disabled = false;
                    if (parseInt(inputPct.value) <= 0 || parseInt(inputPct.value) >= 100) {
                        inputPct.value = 50;
                    }
                }
            });
        }

        // Open modal from any course card button with pre-selected values
        const updateBtns = viewport.querySelectorAll(".btn-open-course-modal");
        updateBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const asgnId = btn.getAttribute("data-assignment-id");
                const curStatus = btn.getAttribute("data-status") || "In Progress";
                const curPct = btn.getAttribute("data-pct") || "50";
                const curExam = btn.getAttribute("data-exam") || "";
                const curNotes = btn.getAttribute("data-notes") || "";

                if (selectCourse) selectCourse.value = asgnId;
                if (selectStatus) {
                    selectStatus.value = curStatus;
                    selectStatus.dispatchEvent(new Event("change"));
                }
                if (inputPct && curStatus === "In Progress") inputPct.value = curPct;
                if (inputExam) inputExam.value = curExam;
                if (inputNotes) inputNotes.value = curNotes;

                modal.classList.remove("hidden");
            });
        });

        // Form submit handler
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const asgnId = parseInt(selectCourse.value);
                const statusVal = selectStatus.value;
                const pctVal = parseInt(inputPct.value);
                const examVal = inputExam.value || null;
                const notesVal = inputNotes.value.trim() || null;

                try {
                    await ApiService.submitProgress({
                        assignment_id: asgnId,
                        course_status: statusVal,
                        progress_percentage: pctVal,
                        exam_date: examVal,
                        comments: notesVal
                    }, empId);

                    store.showToast("Progress successfully saved and synced to centralized HR records!", "success");
                    modal.classList.add("hidden");
                    await this.renderZohoActivitiesDashboard(viewport, empId);
                } catch (err) {
                    store.showToast(err.message, "error");
                }
            };
        }
    }

    /**
     * Zoho HR Admin Training & Certification Records Grid (Exclusive to HR)
     * Groups by unique employee so no employee is repeated, and provides
     * a dropdown to select each specific course and view its live details.
     */
    static async renderZohoAdminGrid(viewport) {
        viewport.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: #64748b;">
                <div style="font-size: 1.5rem; margin-bottom: 8px;">📊</div>
                <div>Loading Zoho Centralized HR Admin Records...</div>
            </div>
        `;

        try {
            const [stats, assignments] = await Promise.all([
                ApiService.getAdminDashboard(),
                ApiService.getAdminAssignments()
            ]);

            // Group assignments by unique employee
            const employeeMap = new Map();
            const allAvailableCourseCodes = new Set();

            for (const a of assignments) {
                const empId = a.employee ? a.employee.employee_id : "UNKNOWN";
                if (!employeeMap.has(empId)) {
                    employeeMap.set(empId, {
                        employee: a.employee,
                        assignments: []
                    });
                }
                employeeMap.get(empId).assignments.push(a);

                if (a.course && a.course.course_code) {
                    allAvailableCourseCodes.add(a.course.course_code);
                }
            }

            const uniqueEmployees = Array.from(employeeMap.values());

            viewport.innerHTML = `
                <div style="padding: 24px; max-width: 1380px; margin: 0 auto; width: 100%;">
                    <!-- Admin Header Card -->
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #16a34a; border-radius: 6px; padding: 14px 18px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <strong style="color: #166534; font-size: 0.95rem;">HR Centralized View (Zoho People Grid)</strong>
                                <span style="background: #dcfce7; color: #15803d; font-size: 0.70rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;">EXCLUSIVE HR ACCESS</span>
                            </div>
                            <div style="font-size: 0.8rem; color: #475569; margin-top: 2px;">
                                Total enrolled: <strong>${stats.total_assignments}</strong> assignments &bull; 
                                Unique employees: <strong>${uniqueEmployees.length}</strong> (No duplicates) &bull; 
                                <strong>${stats.on_risk}</strong> On-Risk alerts &bull; 
                                <strong>${stats.certified}</strong> Certified
                            </div>
                        </div>
                        <button id="zoho-btn-excel" class="btn btn-outline btn-sm" style="background: #ffffff; border: 1px solid #0077cc; color: #0077cc; padding: 6px 14px; border-radius: 4px; font-weight: 600; cursor: pointer;">
                            Download Spreadsheet (.xlsx)
                        </button>
                    </div>

                    <!-- Training Records Table -->
                    <div class="zoho-card" style="padding: 16px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b;">Organization Employee Training Progress Summary</h3>
                                <p style="font-size: 0.76rem; color: #64748b; margin-top: 2px;">
                                    Each employee is listed once. Select any course from the dropdown to review specific certification details.
                                </p>
                            </div>
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #475569;">
                                    <span>Sync Course:</span>
                                    <select id="global-course-filter" style="padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.76rem; font-family: inherit; font-weight: 600; color: #1e293b; background: #f8fafc; cursor: pointer;">
                                        <option value="">Default (First Course)</option>
                                        ${Array.from(allAvailableCourseCodes).map(code => `<option value="${code}">${code}</option>`).join("")}
                                    </select>
                                </div>
                                <button id="btn-back-to-activities" style="background: transparent; border: none; color: #0077cc; font-size: 0.82rem; font-weight: 600; cursor: pointer;">
                                    &larr; Return to My Space (Activities)
                                </button>
                            </div>
                        </div>

                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Employee ID</th>
                                        <th>Employee Name</th>
                                        <th style="min-width: 210px;">Course (Select Course)</th>
                                        <th>Progress</th>
                                        <th>Course Status</th>
                                        <th>Admin Status</th>
                                        <th>Planned Exam</th>
                                        <th>Week 1</th>
                                        <th>Week 2</th>
                                        <th>Latest Comments</th>
                                    </tr>
                                </thead>
                                <tbody id="zoho-admin-grid-tbody">
                                    ${uniqueEmployees.map(empData => {
                                        const emp = empData.employee;
                                        const empId = emp ? emp.employee_id : "";
                                        const firstAsgn = empData.assignments[0];

                                        return `
                                            <tr id="row-emp-${empId}" data-emp-id="${empId}">
                                                <td><code>${empId}</code></td>
                                                <td><strong>${emp ? emp.name : ''}</strong></td>
                                                <td>
                                                    <select class="zoho-table-course-select" data-emp-id="${empId}" style="width: 100%; max-width: 250px; padding: 5px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.78rem; font-family: inherit; font-weight: 600; color: #1e293b; background: #ffffff; cursor: pointer;">
                                                        ${empData.assignments.map(a => `
                                                            <option value="${a.id}" ${a.id === firstAsgn.id ? 'selected' : ''}>
                                                                ${a.course ? a.course.course_code : 'Course'} - ${a.course ? a.course.course_name : a.certification_name} (${a.progress_percentage}%)
                                                            </option>
                                                        `).join("")}
                                                    </select>
                                                </td>
                                                <td class="cell-progress">
                                                    <!-- Filled dynamically -->
                                                </td>
                                                <td class="cell-course-status">
                                                    <!-- Filled dynamically -->
                                                </td>
                                                <td class="cell-admin-status">
                                                    <!-- Filled dynamically -->
                                                </td>
                                                <td class="cell-exam-date">
                                                    <!-- Filled dynamically -->
                                                </td>
                                                <td class="cell-week-1">
                                                    <!-- Filled dynamically -->
                                                </td>
                                                <td class="cell-week-2">
                                                    <!-- Filled dynamically -->
                                                </td>
                                                <td class="cell-comments" style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                                    <!-- Filled dynamically -->
                                                </td>
                                            </tr>
                                        `;
                                    }).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            // Helper to update a row's details for a given assignment
            const updateRowForAssignment = (rowEl, asgn) => {
                if (!rowEl || !asgn) return;

                // 1. Progress
                const cellProgress = rowEl.querySelector(".cell-progress");
                if (cellProgress) {
                    const isComplete = asgn.course_status === "Completed";
                    cellProgress.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="zoho-progress-mini-bar" style="width: 70px;">
                                <div class="zoho-progress-mini-fill ${isComplete ? 'completed' : ''}" style="width: ${asgn.progress_percentage || 0}%;"></div>
                            </div>
                            <strong style="font-size: 0.8rem; color: #1e293b;">${asgn.progress_percentage || 0}%</strong>
                        </div>
                    `;
                }

                // 2. Course Status
                const cellCourseStatus = rowEl.querySelector(".cell-course-status");
                if (cellCourseStatus) {
                    const st = asgn.course_status || "Not Started";
                    cellCourseStatus.innerHTML = `
                        <span class="zoho-session-meta-pill ${st.toLowerCase().replace(' ', '-')}">${st}</span>
                    `;
                }

                // 3. Admin Status
                const cellAdminStatus = rowEl.querySelector(".cell-admin-status");
                if (cellAdminStatus) {
                    const ast = asgn.admin_status || "In Progress";
                    const badgeClass = ast === "On Risk" ? "on-risk" : (ast === "Certified" ? "completed" : "in-progress");
                    cellAdminStatus.innerHTML = `
                        <span class="zoho-session-meta-pill ${badgeClass}">
                            ${ast === "On Risk" ? '⚠️ ' : ''}${ast}
                        </span>
                    `;
                }

                // 4. Planned Exam
                const cellExam = rowEl.querySelector(".cell-exam-date");
                if (cellExam) {
                    cellExam.innerHTML = asgn.exam_date ? asgn.exam_date : `<span style="color: #94a3b8;">Not set</span>`;
                }

                // 5. Week 1 and Week 2
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
                const cellW1 = rowEl.querySelector(".cell-week-1");
                if (cellW1) cellW1.textContent = w1;

                const cellW2 = rowEl.querySelector(".cell-week-2");
                if (cellW2) cellW2.textContent = w2;

                // 6. Comments
                const cellComments = rowEl.querySelector(".cell-comments");
                if (cellComments) {
                    const notes = asgn.latest_comments || "";
                    cellComments.textContent = notes || "-";
                    cellComments.title = notes;
                    cellComments.style.color = notes ? "#334155" : "#94a3b8";
                }
            };

            // Initialize every unique employee row with their first course
            uniqueEmployees.forEach(empData => {
                const empId = empData.employee ? empData.employee.employee_id : "";
                const row = viewport.querySelector(`#row-emp-${empId}`);
                if (row && empData.assignments.length > 0) {
                    updateRowForAssignment(row, empData.assignments[0]);
                }
            });

            // Listen for course selection changes within each employee row
            const courseSelects = viewport.querySelectorAll(".zoho-table-course-select");
            courseSelects.forEach(sel => {
                sel.addEventListener("change", (e) => {
                    const selectedAsgnId = parseInt(e.target.value);
                    const empId = sel.getAttribute("data-emp-id");
                    const empData = employeeMap.get(empId);
                    if (empData) {
                        const asgn = empData.assignments.find(a => a.id === selectedAsgnId);
                        const row = viewport.querySelector(`#row-emp-${empId}`);
                        if (asgn && row) {
                            updateRowForAssignment(row, asgn);
                        }
                    }
                });
            });

            // Handle global filter to sync all rows to a course
            const globalFilter = viewport.querySelector("#global-course-filter");
            if (globalFilter) {
                globalFilter.addEventListener("change", (e) => {
                    const targetCode = e.target.value;
                    uniqueEmployees.forEach(empData => {
                        const empId = empData.employee ? empData.employee.employee_id : "";
                        const row = viewport.querySelector(`#row-emp-${empId}`);
                        const sel = row ? row.querySelector(".zoho-table-course-select") : null;
                        if (!sel) return;

                        if (!targetCode) {
                            sel.value = empData.assignments[0].id;
                            updateRowForAssignment(row, empData.assignments[0]);
                        } else {
                            const match = empData.assignments.find(a => a.course && a.course.course_code === targetCode);
                            if (match) {
                                sel.value = match.id;
                                updateRowForAssignment(row, match);
                            }
                        }
                    });
                });
            }

            viewport.querySelector("#zoho-btn-excel").addEventListener("click", () => {
                window.location.href = ApiService.getExcelExportUrl();
            });

            viewport.querySelector("#btn-back-to-activities").addEventListener("click", () => {
                store.setState({ zohoActiveTab: "activities" });
                this.renderCurrentTab(document.getElementById("zoho-app-container"));
            });

        } catch (err) {
            viewport.innerHTML = `<div style="color: #ef4444; padding: 3rem; text-align: center;">Error loading Zoho Admin records.</div>`;
        }
    }
}
