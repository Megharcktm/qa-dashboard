import * as API from './apiHelper';
import {
  TicketsListResponse,
  TicketDetailResponse,
  Stats,
  TicketFilters,
  PaginationInfo,
  SyncStatus,
} from '../types/ticket.types';

const API_BASE_URL = '';

export const ENDPOINTS = {
  health: `${API_BASE_URL}/health`,
  tickets: {
    list: `${API_BASE_URL}/tickets`,
    detail: (id: string) => `${API_BASE_URL}/tickets/${id}`,
    stats: `${API_BASE_URL}/tickets/stats`,
  },
  sync: {
    trigger: `${API_BASE_URL}/sync/trigger`,
    status: (id: number) => `${API_BASE_URL}/sync/status/${id}`,
    history: `${API_BASE_URL}/sync/history`,
  },
};

// Ticket API functions
export const ticketsAPI = {
  /**
   * Get list of tickets with filters and pagination
   */
  getTickets: async (
    filters?: TicketFilters,
    pagination?: PaginationInfo
  ): Promise<TicketsListResponse> => {
    const params: any = {
      ...(pagination && { page: pagination.page, limit: pagination.limit }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.state && { state: filters.state }),
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo }),
    };

    return API.get<TicketsListResponse>(ENDPOINTS.tickets.list, params);
  },

  /**
   * Get single ticket detail by ID or display_id
   */
  getTicket: async (id: string): Promise<TicketDetailResponse> => {
    return API.get<TicketDetailResponse>(ENDPOINTS.tickets.detail(id));
  },

  /**
   * Get dashboard statistics
   */
  getStats: async (): Promise<Stats> => {
    return API.get<Stats>(ENDPOINTS.tickets.stats);
  },

  /**
   * Update ticket automated test field
   */
  updateAutomatedTest: async (ticketId: string, automatedTest: string): Promise<any> => {
    return API.put(`${API_BASE_URL}/tickets/automated-test`, {
      ticket_id: ticketId,
      automated_test: automatedTest,
    });
  },
};

// Sync API functions
export const syncAPI = {
  /**
   * Trigger a manual sync with DevRev
   */
  triggerSync: async (force?: boolean): Promise<any> => {
    return API.post(ENDPOINTS.sync.trigger, { force });
  },

  /**
   * Get status of a specific sync operation
   */
  getSyncStatus: async (syncId: number): Promise<SyncStatus> => {
    return API.get<SyncStatus>(ENDPOINTS.sync.status(syncId));
  },

  /**
   * Get sync history
   */
  getSyncHistory: async (limit?: number): Promise<{ history: SyncStatus[] }> => {
    const params = limit ? { limit } : undefined;
    return API.get(ENDPOINTS.sync.history, params);
  },
};

// Analytics API
export const analyticsAPI = {
  /**
   * Get analytics by product area with optional filters
   */
  getByPart: async (filters?: any): Promise<any> => {
    const params: any = {};
    if (filters?.state) params.state = filters.state;
    if (filters?.priority) params.priority = filters.priority;
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;

    return API.get('/tickets/analytics', params);
  },

  /**
   * Get monthly ticket statistics
   */
  getMonthlyStats: async (): Promise<any> => {
    return API.get('/tickets/monthly');
  },

  /**
   * Get monthly stats grouped by subtype
   */
  getMonthlyStatsBySubtype: async (monthYear: string): Promise<any> => {
    return API.get('/tickets/monthly-by-subtype', { monthYear });
  },

  /**
   * Get monthly stats grouped by automation status
   */
  getMonthlyStatsByAutomationStatus: async (monthYear: string): Promise<any> => {
    return API.get('/tickets/monthly-by-automation', { monthYear });
  },
};

// Automation Plans API
export const automationPlansAPI = {
  /**
   * Get all automation plans
   */
  getAllPlans: async (): Promise<any> => {
    return API.get('/automation-plans');
  },

  /**
   * Get automation plans for a specific month
   */
  getPlansByMonth: async (monthYear: string): Promise<any> => {
    return API.get(`/automation-plans/month/${monthYear}`);
  },

  /**
   * Get automation status distribution for a month
   */
  getStatusDistribution: async (monthYear: string): Promise<any> => {
    return API.get(`/automation-plans/status-distribution/${monthYear}`);
  },

  /**
   * Create a new automation plan
   */
  createPlan: async (plan: any): Promise<any> => {
    return API.post('/automation-plans', plan);
  },

  /**
   * Bulk import automation plans
   */
  bulkImport: async (plans: any[]): Promise<any> => {
    return API.post('/automation-plans/bulk', { plans });
  },

  /**
   * Update an automation plan
   */
  updatePlan: async (id: number, plan: any): Promise<any> => {
    return API.put(`/automation-plans/${id}`, plan);
  },

  /**
   * Delete an automation plan
   */
  deletePlan: async (id: number): Promise<any> => {
    return API.deleteResource(`/automation-plans/${id}`);
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    return API.get(ENDPOINTS.health);
  },
};
