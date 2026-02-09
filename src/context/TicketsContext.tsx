import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  TicketsState,
  Ticket,
  TicketFilters,
  PaginationInfo,
  Stats,
  SyncStatus,
} from '../types/ticket.types';
import { ticketsAPI, syncAPI } from '../api/endpoints';

// Action types
type Action =
  | { type: 'FETCH_TICKETS_REQUEST' }
  | { type: 'FETCH_TICKETS_SUCCESS'; payload: { tickets: Ticket[]; pagination: PaginationInfo } }
  | { type: 'FETCH_TICKETS_ERROR'; payload: string }
  | { type: 'FETCH_STATS_SUCCESS'; payload: Stats }
  | { type: 'SET_FILTERS'; payload: TicketFilters }
  | { type: 'SET_PAGINATION'; payload: PaginationInfo }
  | { type: 'SYNC_TRIGGERED'; payload: SyncStatus }
  | { type: 'SYNC_COMPLETED'; payload: SyncStatus }
  | { type: 'SYNC_FAILED'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: TicketsState = {
  tickets: [],
  stats: null,
  loading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  },
  syncStatus: null,
};

// Reducer
const ticketsReducer = (state: TicketsState, action: Action): TicketsState => {
  switch (action.type) {
    case 'FETCH_TICKETS_REQUEST':
      return { ...state, loading: true, error: null };

    case 'FETCH_TICKETS_SUCCESS':
      return {
        ...state,
        loading: false,
        tickets: action.payload.tickets,
        pagination: action.payload.pagination,
      };

    case 'FETCH_TICKETS_ERROR':
      return { ...state, loading: false, error: action.payload };

    case 'FETCH_STATS_SUCCESS':
      return { ...state, stats: action.payload };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload,
        pagination: { ...state.pagination, page: 1 }, // Reset to first page on filter change
      };

    case 'SET_PAGINATION':
      return { ...state, pagination: action.payload };

    case 'SYNC_TRIGGERED':
      return { ...state, syncStatus: action.payload };

    case 'SYNC_COMPLETED':
      return {
        ...state,
        syncStatus: action.payload,
        // Refresh data after successful sync
      };

    case 'SYNC_FAILED':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
};

// Context
interface TicketsContextType {
  state: TicketsState;
  fetchTickets: (filters?: TicketFilters, pagination?: PaginationInfo) => Promise<void>;
  fetchStats: () => Promise<void>;
  triggerSync: (force?: boolean) => Promise<void>;
  setFilters: (filters: TicketFilters) => void;
  setPagination: (pagination: PaginationInfo) => void;
  clearError: () => void;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

// Provider component
export const TicketsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(ticketsReducer, initialState);

  const fetchTickets = async (
    filters?: TicketFilters,
    pagination?: PaginationInfo
  ): Promise<void> => {
    dispatch({ type: 'FETCH_TICKETS_REQUEST' });

    try {
      const finalFilters = filters || state.filters;
      const finalPagination = pagination || state.pagination;

      const data = await ticketsAPI.getTickets(finalFilters, {
        page: finalPagination.page,
        limit: finalPagination.limit,
      });

      dispatch({
        type: 'FETCH_TICKETS_SUCCESS',
        payload: {
          tickets: data.tickets,
          pagination: data.pagination,
        },
      });

      // Update filters and pagination in state
      if (filters) {
        dispatch({ type: 'SET_FILTERS', payload: filters });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tickets';
      dispatch({ type: 'FETCH_TICKETS_ERROR', payload: message });
    }
  };

  const fetchStats = async (): Promise<void> => {
    try {
      const stats = await ticketsAPI.getStats();
      dispatch({ type: 'FETCH_STATS_SUCCESS', payload: stats });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const triggerSync = async (force: boolean = false): Promise<void> => {
    try {
      // Trigger sync
      const syncResult = await syncAPI.triggerSync(force);

      const syncStatus: SyncStatus = {
        id: syncResult.syncId,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        totalFetched: 0,
        totalInserted: 0,
        totalUpdated: 0,
      };

      dispatch({ type: 'SYNC_TRIGGERED', payload: syncStatus });

      // Poll for sync completion
      let polling = true;
      let attempts = 0;
      const maxAttempts = 120; // 2 minutes with 1 second intervals

      while (polling && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
          const status = await syncAPI.getSyncStatus(syncResult.syncId);

          if (status.status !== 'in_progress') {
            dispatch({ type: 'SYNC_COMPLETED', payload: status });
            polling = false;

            // Refresh data after sync completes
            if (status.status === 'success') {
              await fetchTickets();
              await fetchStats();
            }
          } else {
            // Update sync status while in progress
            dispatch({ type: 'SYNC_TRIGGERED', payload: status });
          }
        } catch (error) {
          console.error('Error checking sync status:', error);
        }
      }

      if (polling) {
        dispatch({
          type: 'SYNC_FAILED',
          payload: 'Sync operation timed out',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to trigger sync';
      dispatch({ type: 'SYNC_FAILED', payload: message });
    }
  };

  const setFilters = (filters: TicketFilters): void => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const setPagination = (pagination: PaginationInfo): void => {
    dispatch({ type: 'SET_PAGINATION', payload: pagination });
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: TicketsContextType = {
    state,
    fetchTickets,
    fetchStats,
    triggerSync,
    setFilters,
    setPagination,
    clearError,
  };

  return (
    <TicketsContext.Provider value={value}>
      {children}
    </TicketsContext.Provider>
  );
};

// Custom hook to use context
export const useTickets = (): TicketsContextType => {
  const context = useContext(TicketsContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketsProvider');
  }
  return context;
};
