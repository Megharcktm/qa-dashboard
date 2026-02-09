# 🎯 DevRev QA Dashboard

A comprehensive Quality Assurance dashboard for managing, analyzing, and tracking tickets, issues, and automation metrics from DevRev. Built with React, Express, TypeScript, and Ant Design.

**Live Dashboard Analytics | Dark Mode Support | Real-time Sync | Slack Integration | Advanced Filtering**

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Setup environment variables
cp .env.template .env
# Edit .env and add your DevRev PAT token

# 3. Start development
npm run dev
```

Open `http://localhost:5173` in your browser.

## ✨ Key Features

### 📊 Analytics & Insights
- **Real-time Dashboard** - View total, open, in-progress, and resolved tickets at a glance
- **Monthly Statistics** - Track ticket trends over time with comprehensive monthly breakdowns
- **Product Area Analytics** - Analyze ticket distribution across different product areas
- **Subtype Breakdown** - Categorize tickets by type (Bugs, Enhancements, Support Requests, Knowledge Gaps)
- **Automation Status** - Track automation test coverage and automation progress
- **Visual Charts** - Pie charts and graphs with intelligent color mapping

### 🎫 Ticket Management
- **Advanced Filtering** - Filter by state, type, date range, priority, and search
- **Detailed Views** - Comprehensive ticket information with severity, state, and subtype
- **Slack Integration** - View Slack conversation context directly in ticket details
- **Pagination** - Efficient handling of large datasets (100+ tickets)

### 🔄 Data Synchronization
- **One-Click Sync** - Trigger sync button to fetch latest data from DevRev
- **Transaction Safety** - All-or-nothing sync operations using SQLite transactions
- **Sync History** - Track all synchronization operations with timestamps
- **Auto Transformation** - Automatic state mapping (Closed → Resolved)

### 🎨 User Experience
- **Dark Mode** - Full dark/light theme toggle with localStorage persistence
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Interactive Tiles** - Click tiles to drill down into specific data
- **Real-time Updates** - Dashboard reflects latest data immediately after sync

### 🛡️ Data Management
- **SQLite Database** - Lightweight, embedded database with full schema
- **Error Handling** - Comprehensive error logging and user-friendly messages
- **Type Safety** - Full TypeScript implementation across frontend and backend

## 🏗️ Architecture

### Backend (Node.js/Express) - Port 3001
- RESTful API endpoints
- SQLite database integration
- DevRev API client with authentication
- Sync operation management with progress tracking

### Frontend (React/Vite) - Port 5173
- TypeScript for type safety
- Context API for state management
- Ant Design 5 components
- React Router for navigation

### Database (SQLite)
- Stores tickets, sync history, and app config
- Indexed for fast querying
- Auto-synced from DevRev

## 📋 Setup Instructions

### Prerequisites
- Node.js 18+
- Active DevRev account with API token

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure Environment**
   ```bash
   cp .env.template .env
   ```

3. **Add Your DevRev PAT**
   Edit `.env` and set:
   ```
   DEVREV_PAT_TOKEN=your_token_here
   ```
   Get your token from: DevRev Settings > API Tokens

4. **Start Development**
   ```bash
   npm run dev
   ```

5. **Open Dashboard**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api

## 🎯 Usage

### First Time Setup
1. Click "Sync Now" button to fetch tickets from DevRev
2. Wait for sync to complete (displays progress)
3. Dashboard updates with fetched tickets
4. Use filters to find specific tickets

### Syncing Data
- Click "Sync Now" anytime to refresh data
- Sync runs in background and updates the database
- Last sync time shown in header
- All changes merged with existing data

### Filtering & Search
- **Type**: Issue or Ticket
- **State**: open, in_progress, closed, resolved, etc.
- **Priority**: high, medium, low
- **Search**: Full-text search on title and description

### Viewing Details
- Click any ticket row to see full details
- View all metadata, descriptions, and people
- Inspect raw DevRev data in JSON
- All timestamps shown in relative format

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sync/trigger` | Start DevRev sync |
| GET | `/api/sync/status/:id` | Get sync status |
| GET | `/api/sync/history` | Sync history |
| GET | `/api/tickets` | List tickets |
| GET | `/api/tickets/:id` | Get ticket |
| GET | `/api/tickets/stats` | Get stats |
| GET | `/api/health` | Health check |

## 📦 Environment Variables

```bash
# Server
PORT=3001                               # Backend port
NODE_ENV=development                   # Environment

# DevRev
DEVREV_PAT_TOKEN=your_token           # Required - your API token
DEVREV_API_URL=https://api.devrev.ai/mcp/v1

# Database
DATABASE_PATH=./data/qa_dashboard.db  # SQLite location

# Frontend
VITE_API_URL=http://localhost:3001/api
```

## 📁 Project Structure

```
qa_dashboard/
├── server/
│   ├── index.ts                    # Express server
│   ├── services/                   # DevRev & DB services
│   ├── routes/                     # API routes
│   ├── config/                     # Database config
│   └── models/schema.sql           # Database schema
├── src/
│   ├── components/                 # React components
│   │   ├── common/                 # Shared components
│   │   ├── Dashboard/              # Main dashboard
│   │   ├── TicketList/             # Ticket table & filters
│   │   └── TicketDetail/           # Ticket detail view
│   ├── context/                    # State management
│   ├── api/                        # API client
│   ├── types/                      # TypeScript types
│   ├── styles/                     # CSS
│   ├── App.tsx                     # Root component
│   └── index.tsx                   # Entry point
├── public/                          # Static files
├── data/                            # SQLite database
├── .env                             # Configuration
├── package.json
└── README.md
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev              # Start frontend + backend
npm run server:dev      # Backend only with hot reload
npm run client:dev      # Frontend only with Vite
npm run build           # Build for production
npm start               # Run production build
npm run type-check      # TypeScript validation
npm run lint            # ESLint check
```

### Building for Production

```bash
npm run build
npm start
```

The application will:
1. Serve API from `/api` routes
2. Serve React frontend from `dist/`
3. Listen on port specified in `.env`

## 🐛 Troubleshooting

### DevRev 401 Unauthorized
- PAT token may have expired
- Generate new token from DevRev Settings
- Update `DEVREV_PAT_TOKEN` in `.env`
- Restart server

### Port Already in Use
- Change `PORT` in `.env`
- Update proxy in `vite.config.ts`
- Kill conflicting process: `lsof -ti:3001 | xargs kill -9`

### Empty Dashboard
- Click "Sync Now" to fetch tickets
- Check DevRev account has tickets
- Verify PAT token is valid

### Database Locked
- Kill npm processes: `pkill npm`
- Remove lock file: `rm ./data/*.db-wal`
- Restart server

## 🚢 Deployment Options

### Option 1: Vercel (Recommended - Easiest for Frontend)
**Best for:** Teams using modern deployment platforms
```bash
# 1. Push to GitHub
git push origin main

# 2. Go to vercel.com and connect repository
# 3. Add environment variables (DEVREV_PAT_TOKEN)
# 4. Deploy!
```
**Note:** Vercel is for frontend. Deploy backend separately or use serverless functions.

### Option 2: Netlify + Backend Service
**Frontend on Netlify:**
```bash
npm run build
netlify deploy --prod --dir=dist
```

**Backend on Railway/Render** (see below)

### Option 3: Railway (Full Stack - Recommended)
**Best for:** Full stack deployment
1. Go to [railway.app](https://railway.app)
2. Create new project and connect GitHub
3. Add environment variables (DEVREV_PAT_TOKEN)
4. Railway automatically detects Node.js project
5. Deploy!

**Share public URL:** Railway provides a public domain

### Option 4: Render (Full Stack Alternative)
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Add DEVREV_PAT_TOKEN environment variable
7. Deploy!

### Option 5: Heroku
```bash
# 1. Create Heroku app
heroku create qa-dashboard

# 2. Set environment variables
heroku config:set DEVREV_PAT_TOKEN=your_token

# 3. Deploy
git push heroku main

# 4. View logs
heroku logs --tail
```

### Option 6: Docker + Any Cloud
```bash
# 1. Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
EOF

# 2. Build Docker image
docker build -t qa-dashboard .

# 3. Run locally
docker run -p 3001:3001 -e DEVREV_PAT_TOKEN=your_token qa-dashboard

# 4. Push to Docker Hub or cloud registry
```

### Option 7: Manual Server Deployment
```bash
# 1. Build locally
npm run build

# 2. Upload to server
scp -r dist/ package.json package-lock.json .env user@server:/app/

# 3. SSH into server and run
ssh user@server
cd /app
npm install --production
npm start

# 4. Use PM2 for process management
npm install -g pm2
pm2 start npm --name "qa-dashboard" -- start
pm2 startup
pm2 save
```

## 📚 Further Documentation

- See [SETUP.md](./SETUP.md) for detailed setup guide
- See [server/models/schema.sql](./server/models/schema.sql) for database schema
- Check [.env.template](./.env.template) for all configuration options

## 🤝 Support

For issues:
1. Check troubleshooting section above
2. Review SETUP.md documentation
3. Check application logs in `/tmp/server.log`

## 📄 License

Proprietary - Rocketium
# Deployment Tue Feb 10 04:04:53 IST 2026
