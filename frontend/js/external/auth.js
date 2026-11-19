/**
 * =========================================================
 * EXTERNAL AUTH MODULE
 * frontend/js/external/auth.js
 * Dedicated Login flow for the External Web Dashboard
 * =========================================================
 */

import ApiService from "../api.js";
import { store } from "../state.js";

export class ExternalAuth {
    static async render(container) {
        container.innerHTML = `
            <div class="auth-wrapper">
                <div class="auth-card">
                    <div class="auth-header">
                        <div class="auth-icon">🌐</div>
                        <h1 class="auth-title">Corporate Portal Login</h1>
                        <p class="auth-subtitle">Employee Course Progress Management System</p>
                    </div>

                    <form id="external-login-form">
                        <div class="form-group">
                            <label class="form-label" for="auth-identifier">Company Email or Employee ID</label>
                            <input 
                                type="text" 
                                id="auth-identifier" 
                                class="form-input" 
                                placeholder="e.g. EMP101 or HR001" 
                                required
                            />
                        </div>

                        <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 0.75rem;">
                            Sign In to Dashboard
                        </button>
                    </form>

                    <!-- Quick 1-Click Persona Switcher for Reviewers -->
                    <div class="demo-users-panel">
                        <div class="demo-users-title">Quick Demo Login (Click to Sign In)</div>
                        <div class="demo-user-chips" id="demo-user-list">
                            <div style="font-size: 0.75rem; text-align: center; color: var(--neutral-400);">Loading sample users...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachFormListeners(container);
        await this.loadDemoUsers(container);
    }

    static attachFormListeners(container) {
        const form = container.querySelector("#external-login-form");
        const input = container.querySelector("#auth-identifier");

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const val = input.value.trim();
            if (!val) return;
            await this.executeLogin(val);
        });
    }

    static async loadDemoUsers(container) {
        const listEl = container.querySelector("#demo-user-list");
        try {
            const users = await ApiService.getAvailableUsers();
            listEl.innerHTML = users.map(u => `
                <button type="button" class="demo-chip-btn" data-id="${u.employee_id}">
                    <div>
                        <div class="demo-chip-name">${u.name} (${u.employee_id})</div>
                        <div style="font-size: 0.7rem; color: var(--neutral-500);">${u.department || 'Wissen'}</div>
                    </div>
                    <span class="demo-chip-role ${u.role === 'hr_admin' ? 'hr' : 'emp'}">
                        ${u.role === 'hr_admin' ? 'HR Admin' : 'Employee'}
                    </span>
                </button>
            `).join("");

            // Click listener for each persona chip
            listEl.querySelectorAll(".demo-chip-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    const empId = btn.getAttribute("data-id");
                    this.executeLogin(empId);
                });
            });

        } catch (err) {
            listEl.innerHTML = `<div style="color: var(--danger); font-size: 0.75rem; text-align: center;">Backend offline. Please start FastAPI backend.</div>`;
        }
    }

    static async executeLogin(identifier) {
        try {
            const res = await ApiService.login(identifier);
            store.setState({ currentUser: res.user });
            store.showToast(`Logged in as ${res.user.name} (${res.user.role})`, "success");
        } catch (err) {
            store.showToast(err.message, "error");
        }
    }
}
