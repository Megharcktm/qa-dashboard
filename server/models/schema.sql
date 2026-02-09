-- Tickets table (Issues and Tickets from DevRev)
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,                    -- DevRev DON (e.g., "don:core:dvrv-us-1:devo/xxx:issue/123")
  display_id TEXT NOT NULL UNIQUE,        -- Human-readable ID (e.g., "ISS-123")
  title TEXT NOT NULL,
  body TEXT,                              -- Description/details
  type TEXT NOT NULL,                     -- 'issue' or 'ticket'
  state TEXT,                             -- e.g., 'open', 'closed'
  stage_name TEXT,                        -- Stage in workflow
  priority TEXT,                          -- Priority level
  severity TEXT,                          -- Severity (for tickets)
  subtype TEXT,                           -- Subtype (e.g., 'bugs', 'feature_request')
  created_date TEXT NOT NULL,             -- ISO 8601 timestamp
  modified_date TEXT NOT NULL,            -- ISO 8601 timestamp
  target_close_date TEXT,                 -- ISO 8601 timestamp
  created_by_id TEXT,
  created_by_name TEXT,
  modified_by_id TEXT,
  modified_by_name TEXT,
  owned_by_id TEXT,
  owned_by_name TEXT,
  reported_by_id TEXT,
  reported_by_name TEXT,
  applies_to_part_id TEXT,
  applies_to_part_name TEXT,
  tags TEXT,                              -- JSON array of tags
  sprint_id TEXT,
  sprint_name TEXT,
  automated_test TEXT,  -- From DevRev automated_test field, editable from dashboard
  raw_data TEXT NOT NULL,                 -- Full JSON response from DevRev
  synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP  -- Last sync timestamp
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(type);
CREATE INDEX IF NOT EXISTS idx_tickets_state ON tickets(state);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_date ON tickets(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_display_id ON tickets(display_id);
CREATE INDEX IF NOT EXISTS idx_tickets_synced_at ON tickets(synced_at DESC);

-- Sync metadata table
CREATE TABLE IF NOT EXISTS sync_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_started_at TEXT NOT NULL,
  sync_completed_at TEXT,
  status TEXT NOT NULL,                   -- 'success', 'failed', 'in_progress'
  total_fetched INTEGER DEFAULT 0,
  total_inserted INTEGER DEFAULT 0,
  total_updated INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for sync_history
CREATE INDEX IF NOT EXISTS idx_sync_history_status ON sync_history(status);
CREATE INDEX IF NOT EXISTS idx_sync_history_created_at ON sync_history(created_at DESC);

-- Automation Plans table
CREATE TABLE IF NOT EXISTS automation_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_name TEXT NOT NULL,
  release_status TEXT,                        -- DONE, PENDING, NOT PICKED
  complexity TEXT,                            -- Highest, High, Medium, Small, Not possible
  owner TEXT,
  weekly_plan TEXT,                           -- W1, W2, Feb.W1, etc.
  automation_status TEXT,                     -- Done, Pending, Blocked, Not needed, etc.
  test_scenario_document TEXT,                -- URL/link to test scenario doc
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for automation_plans
CREATE INDEX IF NOT EXISTS idx_automation_plans_created_at ON automation_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_plans_automation_status ON automation_plans(automation_status);

-- App configuration table
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default config values
INSERT OR IGNORE INTO app_config (key, value, updated_at)
VALUES
  ('last_successful_sync', '', CURRENT_TIMESTAMP),
  ('sync_in_progress', '0', CURRENT_TIMESTAMP);
