/**
 * =========================================================
 * STATE & NOTIFICATION MODULE
 * frontend/js/state.js
 * Centralized reactive store and toast dispatcher
 * =========================================================
 */

class StateManager {
    constructor() {
        this.state = {
            currentDemoView: "external", // "external" or "zoho"
            currentUser: null,           // Authenticated user in External Dashboard
            zohoActiveEmployee: "EMP101",// Default employee simulated in Zoho
            zohoActiveTab: "employee",   // "employee" or "admin" inside Zoho
            isBackendConnected: false
        };
        this.listeners = [];
    }

    getState() {
        return this.state;
    }

    setState(patch) {
        this.state = { ...this.state, ...patch };
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }

    /**
     * Shows a toast notification on bottom right
     */
    showToast(message, type = "info", durationMs = 3500) {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        
        let icon = "ℹ️";
        if (type === "success") icon = "✅";
        if (type === "error") icon = "⚠️";

        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(100%)";
            toast.style.transition = "all 300ms ease";
            setTimeout(() => toast.remove(), 300);
        }, durationMs);
    }
}

export const store = new StateManager();
