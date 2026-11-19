/**
 * =========================================================
 * MAIN APPLICATION BOOTSTRAPPER
 * frontend/js/app.js
 * Ties all modules, top demo switcher, and views together
 * =========================================================
 */

import ApiService from "./api.js";
import { store } from "./state.js";
import { ExternalAuth } from "./external/auth.js";
import { ExternalEmployeeView } from "./external/employee-view.js";
import { ExternalAdminView } from "./external/admin-view.js";
import { ZohoPreview } from "./zoho/zoho-view.js";

class App {
    static async init() {
        console.log("Initializing Employee Course Progress Management System UI...");

        // 1. Initialize Top Demo Toggle Switcher
        this.setupDemoSwitcher();

        // 2. Check Backend Health
        await this.checkBackendStatus();
        setInterval(() => this.checkBackendStatus(), 10000); // Check every 10s

        // 3. Subscribe to reactive state updates
        store.subscribe((state) => {
            this.handleStateChange(state);
        });

        // 4. Initial Render of current view
        this.renderCurrentView();
    }

    /**
     * Top Two-Button Switcher: Zoho Preview vs External Dashboard
     */
    static setupDemoSwitcher() {
        const btnZoho = document.getElementById("btn-toggle-zoho");
        const btnExternal = document.getElementById("btn-toggle-external");

        btnZoho.addEventListener("click", () => {
            btnZoho.classList.add("active");
            btnExternal.classList.remove("active");
            store.setState({ currentDemoView: "zoho" });
        });

        btnExternal.addEventListener("click", () => {
            btnExternal.classList.add("active");
            btnZoho.classList.remove("active");
            store.setState({ currentDemoView: "external" });
        });
    }

    /**
     * Checks if FastAPI is running on port 8000
     */
    static async checkBackendStatus() {
        const isOnline = await ApiService.checkHealth();
        store.setState({ isBackendConnected: isOnline });

        const statusEl = document.getElementById("backend-status");
        if (statusEl) {
            if (isOnline) {
                statusEl.className = "status-indicator online";
                statusEl.innerHTML = `<span class="dot"></span><span class="text">API Connected</span>`;
            } else {
                statusEl.className = "status-indicator offline";
                statusEl.innerHTML = `<span class="dot"></span><span class="text">API Offline</span>`;
            }
        }
    }

    /**
     * Handles changes to global state
     */
    static handleStateChange(state) {
        const viewExternal = document.getElementById("view-external");
        const viewZoho = document.getElementById("view-zoho");

        if (state.currentDemoView === "zoho") {
            viewZoho.classList.add("active");
            viewExternal.classList.remove("active");
            const zohoContainer = document.getElementById("zoho-app-container");
            ZohoPreview.render(zohoContainer);
        } else {
            viewExternal.classList.add("active");
            viewZoho.classList.remove("active");
            this.renderExternalSection();
        }
    }

    static renderCurrentView() {
        const state = store.getState();
        this.handleStateChange(state);
    }

    /**
     * Renders External Dashboard (Login vs Authenticated App)
     */
    static renderExternalSection() {
        const { currentUser } = store.getState();
        const loginSection = document.getElementById("external-login-section");
        const appSection = document.getElementById("external-app-section");

        if (!currentUser) {
            // User not logged in -> Show dedicated Login screen
            loginSection.classList.remove("hidden");
            appSection.classList.add("hidden");
            ExternalAuth.render(loginSection);
        } else {
            // User authenticated -> Show Dashboard
            loginSection.classList.add("hidden");
            appSection.classList.remove("hidden");
            this.renderExternalApp(currentUser);
        }
    }

    /**
     * Renders Navbar and Active Role View for External App
     */
    static renderExternalApp(user) {
        const navEl = document.getElementById("external-nav");
        const contentEl = document.getElementById("external-content");

        // Navbar
        navEl.innerHTML = `
            <div class="nav-left">
                <div class="nav-app-name">
                    <span style="font-size: 1.25rem;">🎓</span>
                    <span>Course Tracker Portal</span>
                </div>
                <div class="nav-tabs">
                    ${user.role === 'hr_admin' ? `
                        <button id="nav-btn-admin" class="nav-tab-btn active">HR Administration</button>
                    ` : `
                        <button id="nav-btn-employee" class="nav-tab-btn active">My Progress</button>
                    `}
                </div>
            </div>

            <div class="nav-right">
                <div class="user-badge">
                    <div class="user-avatar">${user.name.charAt(0)}</div>
                    <div class="user-details">
                        <span class="user-name">${user.name}</span>
                        <span class="user-role-tag">${user.role === 'hr_admin' ? 'HR Administrator' : 'Engineering Employee'}</span>
                    </div>
                </div>
                <button id="btn-logout" class="btn-logout">Sign Out</button>
            </div>
        `;

        navEl.querySelector("#btn-logout").addEventListener("click", () => {
            store.setState({ currentUser: null });
            store.showToast("Signed out successfully.", "info");
        });

        // Content
        if (user.role === "hr_admin") {
            ExternalAdminView.render(contentEl, user);
        } else {
            ExternalEmployeeView.render(contentEl, user);
        }
    }
}

// Bootstrap on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
