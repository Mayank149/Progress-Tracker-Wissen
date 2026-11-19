/**
 * =========================================================
 * API CLIENT MODULE
 * frontend/js/api.js
 * Communicates with FastAPI backend
 * =========================================================
 */

const API_BASE = "http://127.0.0.1:8000/api";

class ApiService {
    /**
     * Checks if the backend server is reachable
     */
    static async checkHealth() {
        try {
            const res = await fetch("http://127.0.0.1:8000/", { method: "GET" });
            return res.ok;
        } catch (err) {
            return false;
        }
    }

    /**
     * ---------------------------------------------------------
     * Authentication Endpoints
     * ---------------------------------------------------------
     */
    static async getAvailableUsers() {
        const res = await fetch(`${API_BASE}/auth/users`);
        if (!res.ok) throw new Error("Failed to fetch available users");
        return await res.json();
    }

    static async login(identifier) {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier })
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "Login failed");
        }
        return await res.json();
    }

    /**
     * ---------------------------------------------------------
     * Employee Portal Endpoints
     * ---------------------------------------------------------
     */
    static async getEmployeeDashboard(employeeId = "EMP101") {
        const res = await fetch(`${API_BASE}/employee/dashboard?employee_id=${encodeURIComponent(employeeId)}`);
        if (!res.ok) throw new Error("Failed to fetch employee dashboard data");
        return await res.json();
    }

    static async getAssignedCourses(employeeId = "EMP101") {
        const res = await fetch(`${API_BASE}/employee/courses?employee_id=${encodeURIComponent(employeeId)}`);
        if (!res.ok) throw new Error("Failed to fetch assigned courses");
        return await res.json();
    }

    static async submitProgress(payload, employeeId = "EMP101") {
        const res = await fetch(`${API_BASE}/employee/progress?employee_id=${encodeURIComponent(employeeId)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "Failed to submit progress");
        }
        return await res.json();
    }

    static async getAssignmentHistory(assignmentId, employeeId = "EMP101") {
        const res = await fetch(`${API_BASE}/employee/assignment/${assignmentId}/history?employee_id=${encodeURIComponent(employeeId)}`);
        if (!res.ok) throw new Error("Failed to fetch assignment history");
        return await res.json();
    }

    /**
     * ---------------------------------------------------------
     * Admin Portal Endpoints
     * ---------------------------------------------------------
     */
    static async getAdminDashboard() {
        const res = await fetch(`${API_BASE}/admin/dashboard`);
        if (!res.ok) throw new Error("Failed to fetch admin dashboard");
        return await res.json();
    }

    static async getAdminEmployees(searchQuery = "") {
        let url = `${API_BASE}/admin/employees`;
        if (searchQuery) url += `?search=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch employees list");
        return await res.json();
    }

    static async getMasterCourses() {
        const res = await fetch(`${API_BASE}/admin/courses`);
        if (!res.ok) throw new Error("Failed to fetch master courses list");
        return await res.json();
    }

    static async getAdminAssignments(filters = {}) {
        const params = new URLSearchParams();
        if (filters.course_status) params.append("course_status", filters.course_status);
        if (filters.admin_status) params.append("admin_status", filters.admin_status);
        if (filters.search) params.append("search", filters.search);

        const url = `${API_BASE}/admin/assignments${params.toString() ? '?' + params.toString() : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch assignments");
        return await res.json();
    }

    static async assignCourse(payload) {
        const res = await fetch(`${API_BASE}/admin/assign-course`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "Failed to assign course");
        }
        return await res.json();
    }

    static async modifyAssignment(assignmentId, payload) {
        const res = await fetch(`${API_BASE}/admin/assignment/${assignmentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "Failed to modify assignment");
        }
        return await res.json();
    }

    static async getAuditLogs() {
        const res = await fetch(`${API_BASE}/admin/audit-logs`);
        if (!res.ok) throw new Error("Failed to fetch audit logs");
        return await res.json();
    }

    static getExcelExportUrl() {
        return `${API_BASE}/admin/export-excel`;
    }
}

export default ApiService;
