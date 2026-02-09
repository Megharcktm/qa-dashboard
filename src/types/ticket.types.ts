export interface Ticket {
  id: string;
  display_id: string;
  title: string;
  body?: string;
  type: 'issue' | 'ticket';
  state?: string;
  state_display_name?: string;
  stage_name?: string;
  priority?: string;
  severity?: string;
  subtype?: string;
  created_date: string;
  modified_date: string;
  target_close_date?: string;
  created_by_id?: string;
  created_by_name?: string;
  modified_by_id?: string;
  modified_by_name?: string;
  owned_by_id?: string;
  owned_by_name?: string;
  reported_by_id?: string;
  reported_by_name?: string;
  applies_to_part_id?: string;
  applies_to_part_name?: string;
  tags?: Array<{ id: string; name: string }>;
  sprint_id?: string;
  sprint_name?: string;
  automated_test?: string;
  synced_at: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TicketFilters {
  type?: string;
  state?: string;
  priority?: string;
  search?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string;   // ISO date string
}

export interface TicketsState {
  tickets: Ticket[];
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  filters: TicketFilters;
  pagination: PaginationInfo;
  syncStatus: SyncStatus | null;
}

export interface Stats {
  total: number;
  byType: { [key: string]: number };
  byState: { [key: string]: number };
  byPriority: { [key: string]: number };
  lastSyncAt?: string;
}

export interface SyncStatus {
  id: number;
  status: 'success' | 'failed' | 'in_progress';
  startedAt: string;
  completedAt?: string;
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  errorMessage?: string;
}

export interface TicketsListResponse {
  tickets: Ticket[];
  pagination: PaginationInfo;
}

export interface SlackMessage {
  user?: string;
  username?: string;
  text: string;
  ts: string;
  thread_ts?: string;
}

export interface SlackConversation {
  channel: string;
  messages: SlackMessage[];
  error?: string;
}

export interface Discussion {
  id: string;
  body: string;
  created_by?: {
    display_name?: string;
    full_name?: string;
    email?: string;
  };
  created_date?: string;
  type?: string;
}

export interface TicketDetailResponse {
  ticket: Ticket;
  rawData: any;
  slackConversation?: SlackConversation;
  discussions?: Discussion[];
}
