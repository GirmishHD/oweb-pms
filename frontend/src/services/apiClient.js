const isDev = import.meta.env.DEV || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

const CANDIDATE_BASE_URLS = [
    import.meta.env.VITE_API_URL,
    ...(isDev ? [
        'http://localhost:8000/api',
        'http://localhost:8001/api',
        'http://127.0.0.1:8000/api',
        'http://127.0.0.1:8001/api'
    ] : [])
].filter(Boolean);
const BASE_URLS = Array.from(new Set(CANDIDATE_BASE_URLS.length ? CANDIDATE_BASE_URLS : ['/api']));
let activeBaseIndex = 0;

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('oweb_jwt_access') || null;
        this.refreshToken = localStorage.getItem('oweb_jwt_refresh') || null;
    }
    getBaseUrl() {
        return BASE_URLS[activeBaseIndex] || BASE_URLS[0];
    }
    setTokens(access, refresh) {
        this.token = access;
        this.refreshToken = refresh;
        if (access) {
            localStorage.setItem('oweb_jwt_access', access);
        }
        else {
            localStorage.removeItem('oweb_jwt_access');
        }
        if (refresh) {
            localStorage.setItem('oweb_jwt_refresh', refresh);
        }
        else {
            localStorage.removeItem('oweb_jwt_refresh');
        }
    }
    getHeaders(isJson = true) {
        const headers = {};
        if (isJson) {
            headers['Content-Type'] = 'application/json';
        }
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }
    async request(endpoint, options = {}) {
        const headers = this.getHeaders(options.isJson !== false);
        const config = {
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {})
            }
        };
        if (options.body && typeof options.body === 'object' && options.isJson !== false) {
            config.body = JSON.stringify(options.body);
        }
        
        let lastError = null;
        // Try active base URL and fallback to others if network connection fails
        for (let attempt = 0; attempt < BASE_URLS.length; attempt++) {
            const currentIdx = (activeBaseIndex + attempt) % BASE_URLS.length;
            const baseUrl = BASE_URLS[currentIdx];
            const url = `${baseUrl}${endpoint}`;
            try {
                const response = await fetch(url, config);
                // Connected successfully, remember this working base URL
                activeBaseIndex = currentIdx;
                
                if (response.status === 401 && this.refreshToken && !options._retry) {
                    const refreshed = await this.refreshAccessToken();
                    if (refreshed) {
                        options._retry = true;
                        return this.request(endpoint, options);
                    }
                }
                if (!response.ok) {
                    let errorData = null;
                    try {
                        errorData = await response.json();
                    }
                    catch (e) {
                        errorData = { detail: response.statusText };
                    }
                    let message = errorData.detail || errorData.message;
                    if (!message && typeof errorData === 'object' && errorData !== null) {
                        message = Object.entries(errorData)
                            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                            .join('; ');
                    }
                    throw new Error(message || `API error: ${response.status}`);
                }
                if (response.status === 204) {
                    return null;
                }
                return await response.json();
            }
            catch (fetchErr) {
                lastError = fetchErr;
                // Only retry on network failures (connection refused / failed to fetch)
                const isNetworkError = fetchErr instanceof TypeError || fetchErr.message?.includes('Failed to fetch') || fetchErr.message?.includes('NetworkError');
                if (!isNetworkError) {
                    throw fetchErr;
                }
            }
        }
        throw lastError || new Error("Unable to connect to the backend API.");
    }
    async refreshAccessToken() {
        try {
            const res = await fetch(`${this.getBaseUrl()}/auth/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: this.refreshToken })
            });
            if (res.ok) {
                const data = await res.json();
                this.setTokens(data.access, this.refreshToken);
                return true;
            }
        }
        catch (e) {
            console.error('Failed to refresh JWT token:', e);
        }
        this.setTokens(null, null);
        return false;
    }
    // Auth Endpoints
    async login(username, password) {
        const data = await this.request('/auth/login/', {
            method: 'POST',
            body: { username, password }
        });
        this.setTokens(data.access, data.refresh);
        return data;
    }
    async getMe() {
        return await this.request('/auth/users/me/');
    }
    async getUsers() {
        const data = await this.request('/auth/users/');
        return data.results ? data.results : data;
    }
    async createUser(userData) {
        return await this.request('/auth/users/', {
            method: 'POST',
            body: userData
        });
    }
    async updateUser(id, userData) {
        return await this.request(`/auth/users/${id}/`, {
            method: 'PATCH',
            body: userData
        });
    }
    async deleteUser(id) {
        return await this.request(`/auth/users/${id}/`, {
            method: 'DELETE'
        });
    }
    // Roles
    async getRoles() {
        const data = await this.request('/auth/roles/');
        return data.results ? data.results : data;
    }
    async saveRole(roleData) {
        if (roleData.id && typeof roleData.id === 'number') {
            return await this.request(`/auth/roles/${roleData.id}/`, {
                method: 'PUT',
                body: roleData
            });
        }
        return await this.request('/auth/roles/', {
            method: 'POST',
            body: roleData
        });
    }
    // Programs, NGOs, Staff
    async getPrograms() {
        const data = await this.request('/programs/portfolios/');
        return data.results ? data.results : data;
    }
    async saveProgram(programData) {
        if (programData.id && typeof programData.id === 'number') {
            return await this.request(`/programs/portfolios/${programData.id}/`, {
                method: 'PUT',
                body: programData
            });
        }
        return await this.request('/programs/portfolios/', {
            method: 'POST',
            body: programData
        });
    }
    async getNgos() {
        const data = await this.request('/programs/ngos/');
        return data.results ? data.results : data;
    }
    async saveNgo(ngoData) {
        if (ngoData.id && typeof ngoData.id === 'number') {
            return await this.request(`/programs/ngos/${ngoData.id}/`, {
                method: 'PUT',
                body: ngoData
            });
        }
        return await this.request('/programs/ngos/', {
            method: 'POST',
            body: ngoData
        });
    }
    async getStaff() {
        const data = await this.request('/programs/staff/');
        return data.results ? data.results : data;
    }
    async saveStaff(staffData) {
        if (staffData.id && typeof staffData.id === 'number') {
            return await this.request(`/programs/staff/${staffData.id}/`, {
                method: 'PUT',
                body: staffData
            });
        }
        return await this.request('/programs/staff/', {
            method: 'POST',
            body: staffData
        });
    }
    // Development Partners & Documents
    async getDevelopmentPartners() {
        const data = await this.request('/programs/partners/');
        return data.results ? data.results : data;
    }
    async saveDevelopmentPartner(partnerData) {
        if (partnerData.id && typeof partnerData.id === 'number') {
            return await this.request(`/programs/partners/${partnerData.id}/`, {
                method: 'PUT',
                body: partnerData
            });
        }
        return await this.request('/programs/partners/', {
            method: 'POST',
            body: partnerData
        });
    }
    async getPartnerDocuments() {
        const data = await this.request('/programs/documents/');
        return data.results ? data.results : data;
    }
    async savePartnerDocument(docData) {
        if (docData.id && typeof docData.id === 'number') {
            return await this.request(`/programs/documents/${docData.id}/`, {
                method: 'PUT',
                body: docData
            });
        }
        return await this.request('/programs/documents/', {
            method: 'POST',
            body: docData
        });
    }

    // Projects
    async getProjects() {
        const data = await this.request('/projects/schemes/');
        return data.results ? data.results : data;
    }
    async getProject(id) {
        return await this.request(`/projects/schemes/${id}/`);
    }
    async createProject(projectData) {
        return await this.request('/projects/schemes/', {
            method: 'POST',
            body: projectData
        });
    }
    async updateProject(id, projectData) {
        return await this.request(`/projects/schemes/${id}/`, {
            method: 'PATCH',
            body: projectData
        });
    }
    async reviewProject(id, reviewData) {
        return await this.request(`/projects/schemes/${id}/review/`, {
            method: 'POST',
            body: reviewData
        });
    }
    async submitProject(id) {
        return await this.request(`/projects/schemes/${id}/submit/`, {
            method: 'POST'
        });
    }
    async deleteProject(id) {
        return await this.request(`/projects/schemes/${id}/`, {
            method: 'DELETE'
        });
    }
    // Procurements & Tenders
    async getProcurements() {
        const data = await this.request('/procurement/tenders/');
        return data.results ? data.results : data;
    }
    async saveProcurement(procData) {
        const lookupId = procData.id || procData.procurement_id;
        if (lookupId) {
            try {
                return await this.request(`/procurement/tenders/${lookupId}/`, {
                    method: 'PATCH',
                    body: procData
                });
            } catch (patchErr) {
                // If not found yet, create via POST
                if (!patchErr.message || !patchErr.message.includes('404')) {
                    throw patchErr;
                }
            }
        }
        return await this.request('/procurement/tenders/', {
            method: 'POST',
            body: procData
        });
    }
    // Contracts
    async getContracts() {
        const data = await this.request('/contracts/agreements/');
        return data.results ? data.results : data;
    }
    async saveContract(contractData) {
        const lookupId = contractData.id || contractData.contract_id;
        if (lookupId) {
            try {
                return await this.request(`/contracts/agreements/${lookupId}/`, {
                    method: 'PATCH',
                    body: contractData
                });
            } catch (patchErr) {
                // If not found yet, create via POST
                if (!patchErr.message || !patchErr.message.includes('404')) {
                    throw patchErr;
                }
            }
        }
        return await this.request('/contracts/agreements/', {
            method: 'POST',
            body: contractData
        });
    }
    // Field Inspections
    async getInspections() {
        const data = await this.request('/inspections/logs/');
        return data.results ? data.results : data;
    }
    async saveInspection(logData) {
        const lookupId = logData.id || logData.inspection_id;
        if (lookupId) {
            try {
                return await this.request(`/inspections/logs/${lookupId}/`, {
                    method: 'PATCH',
                    body: logData
                });
            } catch (patchErr) {
                if (!patchErr.message || !patchErr.message.includes('404')) {
                    throw patchErr;
                }
            }
        }
        return await this.request('/inspections/logs/', {
            method: 'POST',
            body: logData
        });
    }
    // Weekly Work Plans & Reports
    async getWeeklyPlans() {
        const data = await this.request('/tracking/plans/');
        return data.results ? data.results : data;
    }
    async saveWeeklyPlan(planData) {
        if (planData.id && typeof planData.id === 'number') {
            return await this.request(`/tracking/plans/${planData.id}/`, {
                method: 'PUT',
                body: planData
            });
        }
        return await this.request('/tracking/plans/', {
            method: 'POST',
            body: planData
        });
    }
    async getWeeklyReports() {
        const data = await this.request('/tracking/reports/');
        return data.results ? data.results : data;
    }
    async saveWeeklyReport(reportData) {
        if (reportData.id && typeof reportData.id === 'number') {
            return await this.request(`/tracking/reports/${reportData.id}/`, {
                method: 'PUT',
                body: reportData
            });
        }
        return await this.request('/tracking/reports/', {
            method: 'POST',
            body: reportData
        });
    }
    // Master Data
    async getMasterData() {
        return await this.request('/masterdata/store/');
    }
    async saveMasterData(masterData) {
        return await this.request('/masterdata/store/', {
            method: 'POST',
            body: masterData
        });
    }
    // Documents
    async getDocuments() {
        const data = await this.request('/documents/files/');
        return data.results ? data.results : data;
    }
    async uploadDocument(docData) {
        return await this.request('/documents/files/', {
            method: 'POST',
            body: docData
        });
    }
    async deleteDocument(id) {
        return await this.request(`/documents/files/${id}/`, {
            method: 'DELETE'
        });
    }
    // Notifications
    async getNotifications() {
        const data = await this.request('/auth/notifications/');
        return data.results ? data.results : data;
    }
    async sendNotification(notifData) {
        return await this.request('/auth/notifications/', {
            method: 'POST',
            body: notifData
        });
    }
    async markAllNotificationsRead() {
        return await this.request('/auth/notifications/mark_all_read/', {
            method: 'POST'
        });
    }
    // Activity Logs
    async getActivityLogs() {
        const data = await this.request('/auth/activity-logs/');
        return data.results ? data.results : data;
    }
    async logActivity(logData) {
        return await this.request('/auth/activity-logs/', {
            method: 'POST',
            body: logData
        });
    }
    // Reports
    async getPortfolioSummary() {
        return await this.request('/reports/summary/');
    }
}
export const apiClient = new ApiClient();
export default apiClient;
