import Database from 'better-sqlite3';

export interface Ticket {
  id: string;
  display_id: string;
  title: string;
  body?: string;
  type: string;
  state?: string;
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
  tags?: string; // JSON
  sprint_id?: string;
  sprint_name?: string;
  automated_test?: string;
  raw_data: string; // JSON
  synced_at: string;
}

export interface TicketFilters {
  type?: string;
  state?: string;
  priority?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface TicketsResponse {
  tickets: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Stats {
  total: number;
  byType: { [key: string]: number };
  byState: { [key: string]: number };
  byPriority: { [key: string]: number };
  lastSyncAt?: string;
}

export interface SyncRecord {
  id: number;
  sync_started_at: string;
  sync_completed_at?: string;
  status: string;
  total_fetched: number;
  total_inserted: number;
  total_updated: number;
  error_message?: string;
  created_at: string;
}

export class DatabaseService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Get database instance for direct queries
   */
  getDb(): Database.Database {
    return this.db;
  }

  /**
   * Upsert a single ticket - insert or update if exists
   */
  upsertTicket(ticket: any): void {
    const stmt = this.db.prepare(`
      INSERT INTO tickets (
        id, display_id, title, body, type, state, stage_name,
        priority, severity, subtype, created_date, modified_date,
        target_close_date, created_by_id, created_by_name,
        modified_by_id, modified_by_name,
        owned_by_id, owned_by_name,
        reported_by_id, reported_by_name,
        applies_to_part_id, applies_to_part_name,
        tags, sprint_id, sprint_name, automated_test, raw_data, synced_at
      ) VALUES (
        @id, @display_id, @title, @body, @type, @state, @stage_name,
        @priority, @severity, @subtype, @created_date, @modified_date,
        @target_close_date, @created_by_id, @created_by_name,
        @modified_by_id, @modified_by_name,
        @owned_by_id, @owned_by_name,
        @reported_by_id, @reported_by_name,
        @applies_to_part_id, @applies_to_part_name,
        @tags, @sprint_id, @sprint_name, @automated_test, @raw_data, CURRENT_TIMESTAMP
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        body = excluded.body,
        state = excluded.state,
        stage_name = excluded.stage_name,
        priority = excluded.priority,
        severity = excluded.severity,
        subtype = excluded.subtype,
        modified_date = excluded.modified_date,
        target_close_date = excluded.target_close_date,
        modified_by_id = excluded.modified_by_id,
        modified_by_name = excluded.modified_by_name,
        owned_by_id = excluded.owned_by_id,
        owned_by_name = excluded.owned_by_name,
        reported_by_id = excluded.reported_by_id,
        reported_by_name = excluded.reported_by_name,
        applies_to_part_id = excluded.applies_to_part_id,
        applies_to_part_name = excluded.applies_to_part_name,
        tags = excluded.tags,
        sprint_id = excluded.sprint_id,
        sprint_name = excluded.sprint_name,
        automated_test = excluded.automated_test,
        raw_data = excluded.raw_data,
        synced_at = CURRENT_TIMESTAMP
    `);

    const data = this.transformTicketData(ticket);
    stmt.run(data);
  }

  /**
   * Transform DevRev work data to ticket format
   */
  private transformTicketData(work: any): Record<string, any> {
    // Map "Closed" state to "Resolved"
    let state = work.state_display_name || null;
    if (state === 'Closed') {
      state = 'Resolved';
    }

    return {
      id: work.id,
      display_id: work.display_id || work.id,
      title: work.title || '',
      body: work.body || null,
      type: work.type || 'issue',
      state: state,
      stage_name: work.stage?.stage?.name || null,
      priority: work.priority || null,
      severity: work.severity || null,
      subtype: work.subtype || null,
      created_date: work.created_date,
      modified_date: work.modified_date,
      target_close_date: work.target_close_date || null,
      created_by_id: work.created_by?.id || null,
      created_by_name: work.created_by?.display_name || null,
      modified_by_id: work.modified_by?.id || null,
      modified_by_name: work.modified_by?.display_name || null,
      owned_by_id: work.owned_by?.id || null,
      owned_by_name: work.owned_by?.display_name || null,
      reported_by_id: work.reported_by?.id || null,
      reported_by_name: work.reported_by?.display_name || null,
      applies_to_part_id: work.applies_to_part?.id || null,
      applies_to_part_name: work.applies_to_part?.name || null,
      tags: work.tags ? JSON.stringify(work.tags) : null,
      sprint_id: work.sprint?.id || null,
      sprint_name: work.sprint?.display_name || null,
      automated_test: work.custom_fields?.tnt__automated_test || work.custom_fields?.automated_test || work.automated_test || null,
      raw_data: JSON.stringify(work),
    };
  }

  /**
   * Get tickets with filters and pagination
   */
  getTickets(
    filters: TicketFilters = {},
    pagination: PaginationParams = { page: 1, limit: 50 }
  ): TicketsResponse {
    const { type, state, priority, search, dateFrom, dateTo } = filters;
    const { page, limit } = pagination;

    // Build WHERE clause
    let whereConditions: string[] = [];
    let params: Record<string, any> = {};

    if (type && type !== 'all') {
      whereConditions.push('type = @type');
      params.type = type;
    }

    if (state) {
      whereConditions.push('state = @state');
      params.state = state;
    }

    if (priority) {
      whereConditions.push('priority = @priority');
      params.priority = priority;
    }

    if (search) {
      whereConditions.push('(title LIKE @search OR body LIKE @search)');
      params.search = `%${search}%`;
    }

    if (dateFrom) {
      whereConditions.push('created_date >= @dateFrom');
      params.dateFrom = dateFrom;
    }

    if (dateTo) {
      whereConditions.push('created_date <= @dateTo');
      params.dateTo = dateTo;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Count total
    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM tickets ${whereClause}
    `);
    const { count: total } = countStmt.get(params) as { count: number };

    // Get paginated results
    const offset = (page - 1) * limit;
    const selectStmt = this.db.prepare(`
      SELECT * FROM tickets
      ${whereClause}
      ORDER BY created_date DESC
      LIMIT @limit OFFSET @offset
    `);

    const tickets = selectStmt.all({ ...params, limit, offset }) as Ticket[];

    // Transform "Closed" to "Resolved" for display
    const transformedTickets = tickets.map(ticket => ({
      ...ticket,
      state: ticket.state === 'Closed' ? 'Resolved' : ticket.state,
    }));

    return {
      tickets: transformedTickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single ticket by ID or display_id
   */
  getTicketById(id: string): Ticket | null {
    const stmt = this.db.prepare(`
      SELECT * FROM tickets WHERE id = @id OR display_id = @id LIMIT 1
    `);
    const ticket = (stmt.get({ id }) as Ticket) || null;

    // Transform "Closed" to "Resolved" for display
    if (ticket && ticket.state === 'Closed') {
      ticket.state = 'Resolved';
    }

    return ticket;
  }

  /**
   * Get dashboard statistics
   */
  getStats(): Stats {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM tickets');
    const { count: total } = totalStmt.get() as { count: number };

    const byTypeStmt = this.db.prepare(`
      SELECT type, COUNT(*) as count FROM tickets GROUP BY type
    `);
    const byType: { [key: string]: number } = {};
    (byTypeStmt.all() as Array<{ type: string; count: number }>).forEach(
      row => (byType[row.type || 'unknown'] = row.count)
    );

    const byStateStmt = this.db.prepare(`
      SELECT state, COUNT(*) as count FROM tickets WHERE state IS NOT NULL GROUP BY state
    `);
    const byState: { [key: string]: number } = {};
    (byStateStmt.all() as Array<{ state: string; count: number }>).forEach(
      row => {
        let state = row.state || 'unknown';
        // Map "Closed" to "Resolved"
        if (state === 'Closed') {
          state = 'Resolved';
        }
        byState[state] = (byState[state] || 0) + row.count;
      }
    );

    const byPriorityStmt = this.db.prepare(`
      SELECT priority, COUNT(*) as count FROM tickets WHERE priority IS NOT NULL GROUP BY priority
    `);
    const byPriority: { [key: string]: number } = {};
    (byPriorityStmt.all() as Array<{ priority: string; count: number }>).forEach(
      row => (byPriority[row.priority || 'unknown'] = row.count)
    );

    const lastSyncStmt = this.db.prepare(
      'SELECT synced_at FROM tickets ORDER BY synced_at DESC LIMIT 1'
    );
    const lastSync = lastSyncStmt.get() as { synced_at: string } | undefined;

    return {
      total,
      byType,
      byState,
      byPriority,
      lastSyncAt: lastSync?.synced_at,
    };
  }

  /**
   * Get monthly ticket statistics
   */
  getMonthlyStats(): Array<{
    month: string;
    year: number;
    total: number;
    byState: { [key: string]: number };
  }> {
    const stmt = this.db.prepare(`
      SELECT
        strftime('%Y-%m', created_date) as month_year,
        COUNT(*) as total
      FROM tickets
      WHERE type = 'ticket'
      GROUP BY month_year
      ORDER BY month_year DESC
      LIMIT 12
    `);

    const months = (stmt.all() as Array<{ month_year: string; total: number }>);

    return months.map(({ month_year }) => {
      const [year, month] = month_year.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });

      // Get breakdown by state for this month
      const byStateStmt = this.db.prepare(`
        SELECT state, COUNT(*) as count FROM tickets
        WHERE type = 'ticket' AND strftime('%Y-%m', created_date) = @month_year AND state IS NOT NULL
        GROUP BY state
      `);
      const byState: { [key: string]: number } = {};
      (byStateStmt.all({ month_year }) as Array<{ state: string; count: number }>).forEach(
        row => {
          let state = row.state || 'unknown';
          // Map "Closed" to "Resolved"
          if (state === 'Closed') {
            state = 'Resolved';
          }
          byState[state] = (byState[state] || 0) + row.count;
        }
      );

      const totalStmt = this.db.prepare(
        'SELECT COUNT(*) as count FROM tickets WHERE type = \'ticket\' AND strftime(\'%Y-%m\', created_date) = @month_year'
      );
      const { count: total } = totalStmt.get({ month_year }) as { count: number };

      return {
        month: monthName,
        year: parseInt(year),
        total,
        byState,
      };
    });
  }

  /**
   * Get monthly ticket statistics grouped by subtype
   */
  getMonthlyStatsBySubtype(monthYear: string): Array<{
    subtype: string;
    count: number;
  }> {
    const stmt = this.db.prepare(`
      SELECT subtype, COUNT(*) as count FROM tickets
      WHERE type = 'ticket' AND strftime('%Y-%m', created_date) = @month_year
      GROUP BY subtype
      ORDER BY count DESC
    `);

    const results = stmt.all({ month_year: monthYear }) as Array<{ subtype: string | null; count: number }>;

    // Handle null subtypes separately
    return results.map(row => ({
      subtype: row.subtype || 'Unspecified',
      count: row.count,
    }));
  }

  /**
   * Get monthly stats by automation status
   */
  getMonthlyStatsByAutomationStatus(monthYear: string): Array<{
    status: string;
    count: number;
  }> {
    const stmt = this.db.prepare(`
      SELECT automated_test, COUNT(*) as count FROM tickets
      WHERE type = 'ticket' AND strftime('%Y-%m', created_date) = @month_year
      GROUP BY automated_test
      ORDER BY count DESC
    `);

    const results = stmt.all({ month_year: monthYear }) as Array<{ automated_test: string | null; count: number }>;

    // Handle null automation status separately
    return results.map(row => ({
      status: row.automated_test || 'Not Set',
      count: row.count,
    }));
  }

  /**
   * Get analytics by product area (part) - only for tickets, not issues
   */
  getAnalyticsByPart(filters: TicketFilters = {}): Array<{
    part: string;
    total: number;
    byState: { [key: string]: number };
    byPriority: { [key: string]: number };
  }> {
    const { state, priority, dateFrom, dateTo } = filters;

    // Build WHERE clause for filters
    let whereConditions: string[] = ['type = \'ticket\'', 'applies_to_part_name IS NOT NULL'];
    let params: Record<string, any> = {};

    if (state) {
      whereConditions.push('state = @state');
      params.state = state;
    }

    if (priority) {
      whereConditions.push('priority = @priority');
      params.priority = priority;
    }

    if (dateFrom) {
      whereConditions.push('created_date >= @dateFrom');
      params.dateFrom = dateFrom;
    }

    if (dateTo) {
      whereConditions.push('created_date <= @dateTo');
      params.dateTo = dateTo;
    }

    const whereClause = whereConditions.join(' AND ');

    const stmt = this.db.prepare(`
      SELECT
        applies_to_part_name as part,
        COUNT(*) as total
      FROM tickets
      WHERE ${whereClause}
      GROUP BY applies_to_part_name
      ORDER BY total DESC, part ASC
    `);

    const parts = (stmt.all(params) as Array<{ part: string; total: number }>);

    return parts.map(({ part }) => {
      // Build additional filters for breakdown queries
      const additionalParams = { ...params, part };

      // Get breakdown by state for this part
      const byStateStmt = this.db.prepare(`
        SELECT state, COUNT(*) as count FROM tickets
        WHERE ${whereClause} AND applies_to_part_name = @part AND state IS NOT NULL
        GROUP BY state
      `);
      const byState: { [key: string]: number } = {};
      (byStateStmt.all(additionalParams) as Array<{ state: string; count: number }>).forEach(
        row => {
          let state = row.state || 'unknown';
          // Map "Closed" to "Resolved"
          if (state === 'Closed') {
            state = 'Resolved';
          }
          byState[state] = (byState[state] || 0) + row.count;
        }
      );

      // Get breakdown by priority for this part
      const byPriorityStmt = this.db.prepare(`
        SELECT priority, COUNT(*) as count FROM tickets
        WHERE ${whereClause} AND applies_to_part_name = @part AND priority IS NOT NULL
        GROUP BY priority
      `);
      const byPriority: { [key: string]: number } = {};
      (byPriorityStmt.all(additionalParams) as Array<{ priority: string; count: number }>).forEach(
        row => (byPriority[row.priority || 'unknown'] = row.count)
      );

      const totalStmt = this.db.prepare(
        `SELECT COUNT(*) as count FROM tickets WHERE ${whereClause} AND applies_to_part_name = @part`
      );
      const { count: total } = totalStmt.get(additionalParams) as { count: number };

      return { part, total, byState, byPriority };
    });
  }

  /**
   * Record a sync operation
   */
  recordSync(data: {
    status: 'success' | 'failed' | 'in_progress';
    totalFetched?: number;
    totalInserted?: number;
    totalUpdated?: number;
    errorMessage?: string;
  }): SyncRecord {
    const startedAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO sync_history (
        sync_started_at, status, total_fetched, total_inserted, total_updated, error_message
      ) VALUES (@sync_started_at, @status, @total_fetched, @total_inserted, @total_updated, @error_message)
    `);

    const result = stmt.run({
      sync_started_at: startedAt,
      status: data.status,
      total_fetched: data.totalFetched || 0,
      total_inserted: data.totalInserted || 0,
      total_updated: data.totalUpdated || 0,
      error_message: data.errorMessage || null,
    });

    return {
      id: (result.lastInsertRowid as number) || 0,
      sync_started_at: startedAt,
      status: data.status,
      total_fetched: data.totalFetched || 0,
      total_inserted: data.totalInserted || 0,
      total_updated: data.totalUpdated || 0,
      error_message: data.errorMessage,
      created_at: startedAt,
    };
  }

  /**
   * Update sync record completion
   */
  completeSyncRecord(
    syncId: number,
    data: {
      status: 'success' | 'failed';
      totalInserted?: number;
      totalUpdated?: number;
      errorMessage?: string;
    }
  ): void {
    const stmt = this.db.prepare(`
      UPDATE sync_history
      SET
        sync_completed_at = CURRENT_TIMESTAMP,
        status = @status,
        total_inserted = @total_inserted,
        total_updated = @total_updated,
        error_message = @error_message
      WHERE id = @id
    `);

    stmt.run({
      id: syncId,
      status: data.status,
      total_inserted: data.totalInserted || 0,
      total_updated: data.totalUpdated || 0,
      error_message: data.errorMessage || null,
    });
  }

  /**
   * Get sync history
   */
  getSyncHistory(limit: number = 10): SyncRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM sync_history ORDER BY created_at DESC LIMIT @limit
    `);
    return stmt.all({ limit }) as SyncRecord[];
  }

  /**
   * Get sync status by ID
   */
  getSyncStatus(syncId: number): SyncRecord | null {
    const stmt = this.db.prepare('SELECT * FROM sync_history WHERE id = @id');
    return (stmt.get({ id: syncId }) as SyncRecord) || null;
  }

  /**
   * Clear all tickets
   */
  clearTickets(): void {
    const stmt = this.db.prepare('DELETE FROM tickets');
    stmt.run();
  }

  /**
   * Get database stats for debugging
   */
  getDatabaseInfo(): { ticketCount: number; syncCount: number } {
    const ticketCount = (this.db.prepare('SELECT COUNT(*) as count FROM tickets').get() as { count: number })
      .count;
    const syncCount = (this.db.prepare('SELECT COUNT(*) as count FROM sync_history').get() as { count: number })
      .count;

    return { ticketCount, syncCount };
  }

  /**
   * Add automation plan
   */
  addAutomationPlan(plan: {
    feature_name: string;
    release_status?: string;
    complexity?: string;
    owner?: string;
    weekly_plan?: string;
    automation_status?: string;
    test_scenario_document?: string;
    notes?: string;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO automation_plans (
        feature_name, release_status, complexity, owner, weekly_plan,
        automation_status, test_scenario_document, notes
      ) VALUES (
        @feature_name, @release_status, @complexity, @owner, @weekly_plan,
        @automation_status, @test_scenario_document, @notes
      )
    `);

    stmt.run({
      feature_name: plan.feature_name,
      release_status: plan.release_status || null,
      complexity: plan.complexity || null,
      owner: plan.owner || null,
      weekly_plan: plan.weekly_plan || null,
      automation_status: plan.automation_status || null,
      test_scenario_document: plan.test_scenario_document || null,
      notes: plan.notes || null,
    });
  }

  /**
   * Get all automation plans
   */
  getAutomationPlans(): any[] {
    const stmt = this.db.prepare('SELECT * FROM automation_plans ORDER BY created_at DESC');
    return stmt.all() as any[];
  }

  /**
   * Get automation plans for a specific month (by created_at)
   */
  getAutomationPlansByMonth(monthYear: string): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM automation_plans
      WHERE strftime('%Y-%m', created_at) = @month_year
      ORDER BY created_at DESC
    `);
    return stmt.all({ month_year: monthYear }) as any[];
  }

  /**
   * Get automation status distribution for a month
   */
  getAutomationStatusDistribution(monthYear: string): Array<{ status: string; count: number }> {
    const stmt = this.db.prepare(`
      SELECT automation_status, COUNT(*) as count FROM automation_plans
      WHERE strftime('%Y-%m', created_at) = @month_year
      GROUP BY automation_status
      ORDER BY count DESC
    `);

    const results = stmt.all({ month_year: monthYear }) as Array<{ automation_status: string | null; count: number }>;

    return results.map(row => ({
      status: row.automation_status || 'Not Set',
      count: row.count,
    }));
  }

  /**
   * Update automation plan
   */
  updateAutomationPlan(
    id: number,
    plan: {
      feature_name?: string;
      release_status?: string;
      complexity?: string;
      owner?: string;
      weekly_plan?: string;
      automation_status?: string;
      test_scenario_document?: string;
      notes?: string;
    }
  ): void {
    const updates: string[] = [];
    const params: any = { id };

    Object.entries(plan).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = @${key}`);
        params[key] = value;
      }
    });

    if (updates.length === 0) return;

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const stmt = this.db.prepare(`
      UPDATE automation_plans SET ${updates.join(', ')}
      WHERE id = @id
    `);

    stmt.run(params);
  }

  /**
   * Delete automation plan
   */
  deleteAutomationPlan(id: number): void {
    const stmt = this.db.prepare('DELETE FROM automation_plans WHERE id = @id');
    stmt.run({ id });
  }
}

export function createDatabaseService(db: Database.Database): DatabaseService {
  return new DatabaseService(db);
}
