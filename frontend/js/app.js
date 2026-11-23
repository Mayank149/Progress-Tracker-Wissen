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
    static lastView = null;
    static lastUserId = null;

    static async init() {
        console.log("Initializing Employee Course Progress Management System UI...");

        // 1. Initialize Top Demo Toggle Switcher
        this.setupDemoSwitcher();

        // 2. Subscribe to reactive state updates
        store.subscribe((state) => {
            this.handleStateChange(state);
        });

        // 3. Initial Render of current view
        this.renderCurrentView();

        // 4. Initial Health Check & lightweight status polling (updates only indicator dot)
        await this.checkBackendStatus();
        setInterval(() => this.checkBackendStatus(), 15000);
    }

    /**
     * Top Two-Button Switcher: Zoho Preview vs External Dashboard
     */
    static setupDemoSwitcher() {
        const btnZoho = document.getElementById("btn-toggle-zoho");
        const btnExternal = document.getElementById("btn-toggle-external");

        btnZoho.addEventListener("click", () => {
            if (store.getState().currentDemoView === "zoho") return;
            btnZoho.classList.add("active");
            btnExternal.classList.remove("active");
            store.setState({ currentDemoView: "zoho" });
        });

        btnExternal.addEventListener("click", () => {
            if (store.getState().currentDemoView === "external") return;
            btnExternal.classList.add("active");
            btnZoho.classList.remove("active");
            store.setState({ currentDemoView: "external" });
        });
    }

    /**
     * Checks if FastAPI is running on port 8000.
     * Updates ONLY the DOM status pill without triggering a full-app re-render!
     */
    static async checkBackendStatus() {
        const isOnline = await ApiService.checkHealth();
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
     * Handles changes to global state.
     * Guards against redundant re-rendering!
     */
    static handleStateChange(state) {
        const currentUserId = state.currentUser ? state.currentUser.id : null;

        // If view and user identity have not changed, DO NOT re-render!
        if (this.lastView === state.currentDemoView && this.lastUserId === currentUserId) {
            return;
        }

        this.lastView = state.currentDemoView;
        this.lastUserId = currentUserId;

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
                    <img src="img/logo-wissen.jpg" alt="Wissen Logo" class="nav-app-logo" />
                    <span>Wissen Course Tracker</span>
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
