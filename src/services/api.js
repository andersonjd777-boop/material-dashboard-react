/**
 * DCG Admin Dashboard - API Service
 * Handles all API calls to the DCG backend
 * Includes OpenReplay integration for API performance monitoring
 */

import axios from "axios";
import { ApiEvents } from "./openreplayEvents";

// API base URL - configured via environment variable, defaults to relative path
const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

// Slow request threshold in milliseconds
const SLOW_REQUEST_THRESHOLD = 3000;

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include auth token, CSRF token, and track request start
    this.client.interceptors.request.use(
      (config) => {
        const token =
          localStorage.getItem("dcg_admin_token") || sessionStorage.getItem("dcg_admin_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token for state-changing methods
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (csrfToken && ["post", "put", "patch", "delete"].includes(config.method)) {
          config.headers["X-CSRF-Token"] = csrfToken;
        }

        // Track request start time for performance monitoring
        config.metadata = { startTime: Date.now() };

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle auth errors and track performance
    this.client.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
        const method = response.config.method?.toUpperCase() || "GET";
        const url = response.config.url || "unknown";

        // Track successful request
        ApiEvents.requestComplete(method, url, response.status, duration);

        // Track slow requests
        if (duration > SLOW_REQUEST_THRESHOLD) {
          ApiEvents.slowRequest(method, url, duration);
        }

        return response.data;
      },
      (error) => {
        // Calculate request duration
        const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
        const method = error.config?.method?.toUpperCase() || "GET";
        const url = error.config?.url || "unknown";
        const status = error.response?.status || 0;

        // Track failed request
        ApiEvents.requestError(method, url, error, status);

        if (error.response?.status === 401) {
          localStorage.removeItem("dcg_admin_token");
          localStorage.removeItem("dcg_admin_user");
          localStorage.removeItem("dcg_admin_remember");
          sessionStorage.removeItem("dcg_admin_token");
          sessionStorage.removeItem("dcg_admin_user");
          window.location.href = "/authentication/sign-in";
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token) {
    if (token) {
      this.client.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.Authorization;
    }
  }

  // Generic methods
  get(url, params = {}) {
    return this.client.get(url, { params });
  }

  post(url, data = {}) {
    return this.client.post(url, data);
  }

  put(url, data = {}) {
    return this.client.put(url, data);
  }

  patch(url, data = {}) {
    return this.client.patch(url, data);
  }

  delete(url) {
    return this.client.delete(url);
  }

  // Dashboard Stats
  async getDashboardStats() {
    return this.get("/admin/dashboard/stats");
  }

  // Subscriptions
  async getSubscriptions(params = {}) {
    return this.get("/admin/subscriptions", params);
  }

  async getSubscription(id) {
    return this.get(`/admin/subscriptions/${id}`);
  }

  async updateSubscription(id, data) {
    return this.put(`/admin/subscriptions/${id}`, data);
  }

  // Users/Inmates
  async getUsers(params = {}) {
    return this.get("/admin/users", params);
  }

  async getUser(id) {
    return this.get(`/admin/users/${id}`);
  }

  async createUser(data) {
    return this.post("/admin/users", data);
  }

  async updateUser(id, data) {
    return this.put(`/admin/users/${id}`, data);
  }

  // System Health
  async getSystemHealth() {
    return this.get("/admin/system/health");
  }

  // Stripe Data
  async getStripeProducts() {
    return this.get("/admin/stripe/products");
  }

  async getStripeCustomers(params = {}) {
    return this.get("/admin/stripe/customers", params);
  }

  async getRevenueStats() {
    return this.get("/admin/stripe/revenue");
  }

  // ============================================
  // NEW DASHBOARD API METHODS
  // ============================================

  // Secrets Manager
  async getSecrets() {
    return this.get("/dashboard/secrets");
  }

  async saveSecret(data) {
    return this.post("/dashboard/secrets", data);
  }

  async deleteSecret(key) {
    return this.delete(`/dashboard/secrets/${key}`);
  }

  async revealSecret(key) {
    return this.get(`/dashboard/secrets/${encodeURIComponent(key)}/reveal`);
  }

  // Metrics
  async getStripeMetrics() {
    return this.get("/dashboard/metrics/stripe");
  }

  async getServerMetrics() {
    return this.get("/dashboard/metrics/server");
  }

  async getPM2Status() {
    return this.get("/dashboard/metrics/pm2");
  }

  async getAsteriskStatus() {
    return this.get("/dashboard/metrics/asterisk");
  }

  // System Health
  async getHealthCheck() {
    return this.get("/dashboard/health");
  }

  // Projects
  async getProjects() {
    return this.get("/dashboard/projects");
  }

  async createProject(data) {
    return this.post("/dashboard/projects", data);
  }

  async updateProject(id, data) {
    return this.put(`/dashboard/projects/${id}`, data);
  }

  // ============================================
  // QUICK ACTIONS API METHODS
  // ============================================

  // Service Management
  async getWhisperStatus() {
    return this.get("/quick-actions/services/whisper/status");
  }

  async restartWhisper() {
    return this.post("/quick-actions/services/whisper/restart");
  }

  async getAsteriskActionStatus() {
    return this.get("/quick-actions/services/asterisk/status");
  }

  async restartAsterisk() {
    return this.post("/quick-actions/services/asterisk/restart");
  }

  async getPM2ActionStatus() {
    return this.get("/quick-actions/services/pm2/status");
  }

  // Security & Monitoring
  async getFailedLogins() {
    return this.get("/quick-actions/security/failed-logins");
  }

  async getSecurityLogs() {
    return this.get("/quick-actions/security/logs");
  }

  async clearSecurityLogs() {
    return this.post("/quick-actions/security/logs/clear");
  }

  // Server Maintenance
  async purgeLogs() {
    return this.post("/quick-actions/maintenance/purge-logs");
  }

  async cleanTemp() {
    return this.post("/quick-actions/maintenance/clean-temp");
  }

  async getDiskUsage() {
    return this.get("/quick-actions/maintenance/disk-usage");
  }

  // Storage Management
  async getStorageInfo() {
    return this.get("/quick-actions/storage/info");
  }

  async moveLargeFiles() {
    return this.post("/quick-actions/storage/move-large-files");
  }

  // ============================================
  // JENKINS ASSISTANT API
  // ============================================

  async askJenkinsAssistant(question) {
    return this.post("/assistant/ask", { question });
  }

  // ============================================
  // FLAGGING API
  // ============================================

  async getFlaggedContent(filter = "all") {
    return this.get("/flagging", { filter });
  }

  async resolveFlaggedContent(flagId) {
    return this.post("/flagging/resolve", { flagId });
  }

  async getFlagDetails(flagId) {
    return this.get(`/flagging/details/${flagId}`);
  }

  // ============================================
  // CALL LOGS API
  // ============================================

  async getCallLogs(days = "all", limit = 500) {
    return this.get("/calllogs/list", { days, limit });
  }

  async getCallDetails(uniqueid) {
    return this.get(`/calllogs/details/${uniqueid}`);
  }

  // Call Issues (monitoring)
  async getCallIssueStats(hours = 24) {
    return this.get("/call-issues/stats", { hours });
  }

  async getCallIssues(params = {}) {
    return this.get("/call-issues/list", params);
  }

  async resolveCallIssue(id, notes = "") {
    return this.patch(`/call-issues/${id}/resolve`, { notes });
  }

  async getCallIssueTimeline(hours = 24) {
    return this.get("/call-issues/timeline", { hours });
  }

  // ============================================
  // SHARED DRIVE API
  // ============================================

  async getSharedDriveFiles(folder = "") {
    return this.get("/files/list", { folder });
  }

  async createSharedDriveFolder(folderName, parentFolder = "") {
    return this.post("/files/folder", { folderName, parentFolder });
  }

  async uploadSharedDriveFile(file, folder = "") {
    const formData = new FormData();
    formData.append("file", file);
    if (folder) formData.append("folder", folder);
    return this.client.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async downloadSharedDriveFile(filePath, openInBrowser = false) {
    const token = localStorage.getItem("dcg_admin_token");
    const url = `${API_BASE_URL}/files/download/${encodeURIComponent(filePath)}`;

    try {
      // Use fetch with Authorization header to download file
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get filename from Content-Disposition header or use the file path
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = filePath.split("/").pop();
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      // Create blob and either open in browser or download
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      if (openInBrowser) {
        // Open in new browser tab
        window.open(blobUrl, "_blank");
        // Note: Don't revoke URL immediately when opening in browser
        // The browser needs time to load the file
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
      } else {
        // Trigger download
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error("Download error:", error);
      throw error;
    }
  }

  async deleteSharedDriveItem(path) {
    return this.delete(`/files/delete/${encodeURIComponent(path)}`);
  }

  // ============================================
  // WORK EMAIL HUB API METHODS
  // ============================================

  async getEmailInboxes() {
    return this.get("/email/inboxes");
  }

  async getEmailMessages(inbox, folder = "INBOX", limit = 50, page = 1) {
    return this.get("/email/messages", { inbox, folder, limit, page });
  }

  async getEmailMessage(uid, inbox, folder = "INBOX") {
    return this.get(`/email/message/${uid}`, { inbox, folder });
  }

  async getEmailFolders(inbox) {
    return this.get("/email/folders", { inbox });
  }

  async sendEmail(emailData) {
    return this.post("/email/send", emailData);
  }

  async generateAutoReply(uid, inbox, folder = "INBOX", contextNotes = null) {
    return this.post("/email/auto-reply", { uid, inbox, folder, contextNotes });
  }

  async saveFinalResponse(contextId, finalResponse) {
    return this.post("/email/save-final-response", { contextId, finalResponse });
  }

  // ============================================
  // VOICE MESSAGES API
  // ============================================

  async getVoiceMessages(params = {}) {
    return this.get("/voice-messages/list", params);
  }

  async getVoiceMessageStats() {
    return this.get("/voice-messages/stats");
  }

  async getVoiceMessageFiles() {
    return this.get("/voice-messages/files");
  }

  // ============================================
  // TASK MANAGEMENT (iOS Actions-style)
  // ============================================

  async getTasks(params = {}) {
    return this.get("/tasks", params);
  }

  async createTask(taskData) {
    return this.post("/tasks", taskData);
  }

  async updateTask(taskId, updates) {
    return this.put(`/tasks/${taskId}`, updates);
  }

  async deleteTask(taskId) {
    return this.delete(`/tasks/${taskId}`);
  }

  async completeTask(taskId) {
    return this.post(`/tasks/${taskId}/complete`);
  }

  async getTaskComments(taskId) {
    return this.get(`/tasks/${taskId}/comments`);
  }

  async addTaskComment(taskId, comment) {
    return this.post(`/tasks/${taskId}/comments`, { comment });
  }

  // ============================================
  // PROJECT TIMELINE (Gantt Chart)
  // ============================================

  async getTimelineProjects(params = {}) {
    return this.get("/timeline/projects", params);
  }

  // ============================================
  // SUBSCRIPTION PLANS
  // ============================================

  async getSubscriptionPlans(params = {}) {
    return this.get("/checkout/plans", params);
  }

  // ============================================
  // WORK CALENDAR API METHODS
  // ============================================

  async getWorkCalendarDates() {
    return this.get("/work-calendar/dates");
  }

  async getWorkCalendarDate(date) {
    return this.get(`/work-calendar/date/${date}`);
  }

  async addWorkCalendarItem(itemData) {
    return this.post("/work-calendar/item", itemData);
  }

  async triggerWorkCalendarSync() {
    return this.post("/work-calendar/sync");
  }

  async getGanttData() {
    return this.get("/timeline/gantt-data");
  }

  async createTimelineProject(projectData) {
    return this.post("/timeline/projects", projectData);
  }

  async updateTimelineProject(projectId, updates) {
    return this.put(`/timeline/projects/${projectId}`, updates);
  }

  async deleteTimelineProject(projectId) {
    return this.delete(`/timeline/projects/${projectId}`);
  }

  // ============================================
  // CRM (Customer Relationship Management)
  // ============================================

  async getCrmCustomers(params = {}) {
    return this.get("/crm/customers", params);
  }

  async getCrmCustomer(customerId) {
    return this.get(`/crm/customers/${customerId}`);
  }

  async createCrmCustomer(customerData) {
    return this.post("/crm/customers", customerData);
  }

  async updateCrmCustomer(customerId, updates) {
    return this.put(`/crm/customers/${customerId}`, updates);
  }

  async logCrmInteraction(interactionData) {
    return this.post("/crm/interactions", interactionData);
  }

  async getCrmPipeline(params = {}) {
    return this.get("/crm/pipeline", params);
  }

  async createCrmPipeline(pipelineData) {
    return this.post("/crm/pipeline", pipelineData);
  }

  async updateCrmPipeline(pipelineId, updates) {
    return this.put(`/crm/pipeline/${pipelineId}`, updates);
  }

  async getCrmAnalytics() {
    return this.get("/crm/analytics");
  }

  // ============================================
  // UNIFIED MESSAGES API
  // ============================================

  async getMessageThreads() {
    return this.get("/messages/threads");
  }

  async getThreadMessages(connectionId, limit = 50, offset = 0) {
    return this.get(`/messages/thread/${connectionId}`, { limit, offset });
  }

  async sendMessage(messageData) {
    return this.post("/messages/send", messageData);
  }

  async markMessageAsRead(messageId) {
    return this.client.patch(`/messages/${messageId}/read`);
  }

  async getMessageStats() {
    return this.get("/messages/stats");
  }

  async uploadAttachment(messageId, file) {
    const formData = new FormData();
    formData.append("file", file);
    return this.client.post(`/messages/${messageId}/attach`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async downloadAttachment(attachmentId) {
    try {
      const response = await this.client.get(`/messages/attachment/${attachmentId}`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const filename =
        response.headers["content-disposition"]?.split("filename=")[1]?.replace(/"/g, "") ||
        `attachment-${attachmentId}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      return response;
    } catch (error) {
      console.error("Download attachment failed:", error);
      throw error;
    }
  }

  async deleteAttachment(attachmentId) {
    return this.delete(`/messages/attachment/${attachmentId}`);
  }

  async exportConversation(connectionId, format = "csv") {
    try {
      const response = await this.client.get(`/messages/export/${connectionId}?format=${format}`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `conversation-${connectionId}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      return response;
    } catch (error) {
      console.error("Export conversation failed:", error);
      throw error;
    }
  }

  async getNotificationPreferences() {
    return this.get("/messages/preferences");
  }

  async updateNotificationPreferences(preferences) {
    return this.put("/messages/preferences", preferences);
  }

  // Inmate Search & Thread Creation
  async searchInmates(query) {
    return this.get("/messages/inmates/search", { q: query });
  }

  async createMessageThread(bookingNumber, inmateName, inmateFacility, initialMessage) {
    return this.post("/messages/threads/create", {
      bookingNumber,
      inmateName,
      inmateFacility,
      initialMessage,
    });
  }
}

const api = new ApiService();
export default api;
