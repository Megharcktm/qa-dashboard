# QA Dashboard - Setup & Usage Guide

## Overview

The QA Dashboard is a full-stack application for viewing and managing DevRev Issues and Tickets. It consists of:
- **Backend:** Node.js/Express API with SQLite database
- **Frontend:** React application with Ant Design UI
- **Database:** SQLite for storing ticket data locally

## Quick Start

### 1. Prerequisites

- Node.js 18+ (check with `node --version`)
- npm (comes with Node.js)
- DevRev account with a valid Personal Access Token (PAT)

### 2. Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Setup environment
cp .env.template .env
```

### 3. Configure Environment Variables

Edit `.env` and set your DevRev PAT:

```bash
DEVREV_PAT_TOKEN=your_actual_pat_token_here
```

You can generate a new PAT from your DevRev account settings if your current token has expired.

### 4. Start Development

```bash
# Start both frontend and backend simultaneously
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend on `http://localhost:5173`
- Frontend will be configured to proxy API calls to the backend

### 5. Open Dashboard

Navigate to `http://localhost:5173` in your browser.

## Architecture

### Backend (Node.js/Express)

**Port:** 3001

**Key Files:**
- `server/index.ts` - Main server file
- `server/services/devrev.service.ts` - DevRev API client
- `server/services/database.service.ts` - Database operations
- `server/routes/sync.ts` - Sync endpoints
- `server/routes/tickets.ts` - Ticket listing endpoints
- `server/config/database.ts` - SQLite initialization
- `server/models/schema.sql` - Database schema

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sync/trigger` | Trigger manual sync from DevRev |
| GET | `/api/sync/status/:syncId` | Get sync operation status |
| GET | `/api/sync/history` | Get sync history |
| GET | `/api/tickets` | List tickets with filters/pagination |
| GET | `/api/tickets/:id` | Get single ticket details |
| GET | `/api/tickets/stats` | Get dashboard statistics |
| GET | `/api/health` | Health check |

### Frontend (React)

**Port:** 5173

**Key Directories:**
- `src/components/` - React components
  - `common/` - Header, ErrorBoundary, LoadingSpinner
  - `Dashboard/` - Main dashboard and stats
  - `TicketList/` - Ticket table and filters
  - `TicketDetail/` - Single ticket details view
- `src/api/` - API client
  - `apiHelper.ts` - HTTP client (Axios)
  - `endpoints.ts` - API endpoint definitions
- `src/context/` - State management
  - `TicketsContext.tsx` - Global state with Context API
- `src/types/` - TypeScript type definitions
- `src/styles/` - CSS styles

**Main Routes:**
- `/` - Dashboard (lists all tickets)
- `/tickets/:id` - Ticket detail view

### Database (SQLite)

**Location:** `./data/qa_dashboard.db`

**Tables:**
- `tickets` - DevRev issues/tickets
- `sync_history` - Sync operation records
- `app_config` - Application configuration

## Usage

### Syncing with DevRev

1. Click the "Sync Now" button in the header
2. The sync will:
   - Fetch all issues and tickets from DevRev
   - Store them in the local SQLite database
   - Update the dashboard statistics
3. Sync progress is tracked and displayed

### Filtering Tickets

Use the filter panel to search by:
- **Type:** Issue or Ticket
- **State:** Open, In Progress, Closed, etc.
- **Priority:** High, Medium, Low
- **Search:** Full-text search on title and description

### Viewing Ticket Details

Click on any ticket row to view:
- Full ticket metadata
- Description/body
- People (created by, owned by, reported by, etc.)
- Associated part or sprint
- Tags
- Raw JSON data

## API Response Format

### Tickets List Response

```json
{
  "tickets": [
    {
      "id": "don:core:dvrv-us-1:devo/xxx:issue/123",
      "display_id": "ISS-123",
      "title": "Bug in login flow",
      "body": "Users cannot login...",
      "type": "issue",
      "state": "open",
      "priority": "high",
      "created_date": "2026-02-01T10:00:00Z",
      "modified_date": "2026-02-09T11:00:00Z",
      "created_by_name": "John Doe",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Sync Response

```json
{
  "success": true,
  "message": "Sync completed",
  "syncId": 1,
  "totalFetched": 150,
  "totalStored": 150
}
```

## Troubleshooting

### DevRev Authentication Error (401 Unauthorized)

If you see this error:
1. The PAT token may have expired
2. Generate a new token from your DevRev account
3. Update the `DEVREV_PAT_TOKEN` in `.env`
4. Restart the server: `npm run dev`

### Server Won't Start

If you get "EADDRINUSE" error:
1. Another process is using port 3001
2. Either close the other process or change `PORT=3001` in `.env`
3. Also update `vite.config.ts` proxy target if you change the port

### Database Locked

If you see "database is locked" error:
1. Make sure the database isn't being accessed by multiple processes
2. Kill any running npm processes: `pkill npm`
3. Delete the lock file: `rm ./data/*.db-wal`
4. Restart with `npm run dev`

### Blank Dashboard

1. The database might be empty
2. Click "Sync Now" to fetch tickets from DevRev
3. Wait for the sync to complete
4. Refresh the page (F5)

## Development

### Build for Production

```bash
npm run build
```

This will:
1. Compile TypeScript
2. Build React frontend with Vite
3. Output to `dist/` directory

### Run Production Build

```bash
npm start
```

Server will:
1. Start on port specified in `.env` (default 3001)
2. Serve React frontend from `dist/`
3. Serve API from `/api` routes

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Backend server port |
| `NODE_ENV` | development | Node environment |
| `DEVREV_PAT_TOKEN` | (required) | DevRev API token |
| `DEVREV_API_URL` | https://api.devrev.ai/mcp/v1 | DevRev API endpoint |
| `DATABASE_PATH` | ./data/qa_dashboard.db | SQLite database location |
| `VITE_API_URL` | http://localhost:3001/api | Frontend API URL (dev) |

## Project Structure

```
qa_dashboard/
├── server/                      # Backend Express server
│   ├── index.ts                 # Main server file
│   ├── config/database.ts       # Database setup
│   ├── routes/
│   │   ├── sync.ts             # Sync endpoints
│   │   └── tickets.ts          # Ticket endpoints
│   ├── services/
│   │   ├── devrev.service.ts   # DevRev API client
│   │   └── database.service.ts # Database operations
│   └── models/schema.sql       # Database schema
├── src/                         # Frontend React app
│   ├── components/              # React components
│   ├── context/                 # State management
│   ├── api/                     # API client
│   ├── types/                   # TypeScript types
│   ├── styles/                  # CSS styles
│   ├── App.tsx                  # Root component
│   └── index.tsx                # Entry point
├── public/                       # Static files
├── data/                         # SQLite database
├── package.json                 # Dependencies
├── .env                         # Environment variables
├── tsconfig.json                # TypeScript config
└── vite.config.ts               # Vite config
```

## Testing

### Test Sync Endpoint

```bash
# Start server
npm run server:dev

# In another terminal
curl -X POST http://localhost:3001/api/sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"force":false}'
```

### Test Tickets Endpoint

```bash
curl http://localhost:3001/api/tickets?limit=5
```

### Test Stats Endpoint

```bash
curl http://localhost:3001/api/tickets/stats
```

## Performance Notes

- SQLite is good for ~10,000 tickets
- For larger datasets (100,000+), consider migrating to PostgreSQL
- Sync with DevRev can take a few minutes for large datasets
- Pagination is set to 50 items per page (configurable)

## Next Steps

1. **Verify DevRev PAT:** Check token expiration in DevRev account
2. **Run First Sync:** Click "Sync Now" to fetch tickets
3. **Explore Dashboard:** Filter and search tickets
4. **Build for Production:** Run `npm run build`
5. **Deploy:** Follow your organization's deployment process

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs: `cat /tmp/server.log`
3. Check browser console: Press F12 in browser

## License

Proprietary - Rocketium
