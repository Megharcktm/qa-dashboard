import express, { Router, Request, Response, NextFunction } from 'express';
import { DatabaseService, TicketFilters, PaginationParams } from '../services/database.service';
import SlackService from '../services/slack.service';
import { createDevRevService } from '../services/devrev.service';

const router: Router = express.Router();

// GET /api/tickets/stats - Get dashboard statistics (must come before /:id)
router.get('/stats', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const stats = dbService.getStats();

    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    next(error);
  }
});

// GET /api/tickets/monthly - Get monthly ticket statistics
router.get('/monthly', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const monthlyStats = dbService.getMonthlyStats();

    res.json({ data: monthlyStats });
  } catch (error) {
    console.error('Error getting monthly stats:', error);
    next(error);
  }
});

// GET /api/tickets/monthly-by-subtype - Get monthly stats grouped by subtype
router.get('/monthly-by-subtype', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const monthYear = (req.query.monthYear as string) || new Date().toISOString().slice(0, 7);
    const stats = dbService.getMonthlyStatsBySubtype(monthYear);

    res.json({ data: stats, monthYear });
  } catch (error) {
    console.error('Error getting monthly stats by subtype:', error);
    next(error);
  }
});

// GET /api/tickets/monthly-by-automation - Get monthly stats grouped by automation status
router.get('/monthly-by-automation', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const monthYear = (req.query.monthYear as string) || new Date().toISOString().slice(0, 7);
    const stats = dbService.getMonthlyStatsByAutomationStatus(monthYear);

    res.json({ data: stats, monthYear });
  } catch (error) {
    console.error('Error getting monthly stats by automation:', error);
    next(error);
  }
});

// GET /api/tickets/debug - Debug endpoint to check data
router.get('/debug', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const db = dbService.getDb();

    // Check automated_test field
    const automatedTestCheck = db.prepare(`
      SELECT id, display_id, automated_test, raw_data
      FROM tickets
      WHERE automated_test IS NOT NULL
      LIMIT 5
    `).all();

    // Check if automated_test exists in raw_data
    const rawDataCheck = db.prepare(`
      SELECT id, display_id, raw_data
      FROM tickets
      LIMIT 1
    `).get();

    // Parse raw data to see structure
    let parsedRawData = null;
    if (rawDataCheck?.raw_data) {
      try {
        parsedRawData = JSON.parse(rawDataCheck.raw_data);
      } catch (e) {
        parsedRawData = 'Error parsing raw_data';
      }
    }

    res.json({
      automatedTestValues: automatedTestCheck,
      sampleRawDataStructure: parsedRawData ? {
        hasAutomatedTest: 'automated_test' in (parsedRawData as any),
        hasCustomFields: 'custom_fields' in (parsedRawData as any),
        customFieldsKeys: parsedRawData?.custom_fields ? Object.keys(parsedRawData.custom_fields) : null,
        automatedTestValue: (parsedRawData as any)?.automated_test,
        customFieldsAutomatedTest: parsedRawData?.custom_fields?.automated_test,
        tntAutomatedTest: (parsedRawData as any)?.custom_fields?.tnt__automated_test,
      } : null,
      totalTickets: db.prepare('SELECT COUNT(*) as count FROM tickets').get(),
      ticketsWithAutoTest: db.prepare('SELECT COUNT(*) as count FROM tickets WHERE automated_test IS NOT NULL').get(),
    });
  } catch (error) {
    console.error('Error getting debug info:', error);
    next(error);
  }
});

// GET /api/tickets/analytics - Get analytics by product area with optional filters
router.get('/analytics', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;

    const filters: TicketFilters = {
      state: req.query.state ? String(req.query.state) : undefined,
      priority: req.query.priority ? String(req.query.priority) : undefined,
      dateFrom: req.query.dateFrom ? String(req.query.dateFrom) : undefined,
      dateTo: req.query.dateTo ? String(req.query.dateTo) : undefined,
    };

    const analytics = dbService.getAnalyticsByPart(filters);

    res.json({ data: analytics });
  } catch (error) {
    console.error('Error getting analytics:', error);
    next(error);
  }
});

// GET /api/tickets - List tickets with filters and pagination
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;

    // Parse query parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    const filters: TicketFilters = {
      type: req.query.type ? String(req.query.type) : undefined,
      state: req.query.state ? String(req.query.state) : undefined,
      priority: req.query.priority ? String(req.query.priority) : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
      dateFrom: req.query.dateFrom ? String(req.query.dateFrom) : undefined,
      dateTo: req.query.dateTo ? String(req.query.dateTo) : undefined,
    };

    const pagination: PaginationParams = { page, limit };

    const result = dbService.getTickets(filters, pagination);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/tickets/:id - Get single ticket details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const { id } = req.params;

    const ticket = dbService.getTicketById(id);

    if (!ticket) {
      return res.status(404).json({
        error: true,
        message: 'Ticket not found',
      });
    }

    // Parse raw_data and other JSON fields
    let rawData: any = {};
    let tags: any[] = [];
    let slackConversation: any = null;

    try {
      rawData = JSON.parse(ticket.raw_data || '{}');
    } catch (e) {
      console.error('Error parsing raw_data:', e);
    }

    try {
      tags = ticket.tags ? JSON.parse(ticket.tags) : [];
    } catch (e) {
      console.error('Error parsing tags:', e);
    }

    // Fetch Slack conversation if available
    const slackChannel = rawData.custom_fields?.app_slack__slack_channel;
    const slackMessageTs = rawData.custom_fields?.app_slack__slack_message_ts;

    if (slackChannel) {
      slackConversation = await SlackService.getConversationMessages(
        slackChannel,
        slackMessageTs
      );
    }

    // Fetch internal discussions from DevRev
    let discussions: any[] = [];
    try {
      const devRevService = createDevRevService();
      discussions = await devRevService.fetchWorkDiscussions(ticket.id);
    } catch (e) {
      console.error('Error fetching discussions:', e);
    }

    const response = {
      ticket: {
        ...ticket,
        tags,
      },
      rawData,
      slackConversation,
      discussions,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tickets/automated-test - Update automated test field
router.put('/automated-test', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const { ticket_id, automated_test } = req.body;

    if (!ticket_id) {
      return res.status(400).json({
        error: true,
        message: 'ticket_id is required',
      });
    }

    const db = dbService.getDb();
    db.prepare('UPDATE tickets SET automated_test = ? WHERE id = ?').run(automated_test || null, ticket_id);

    res.json({
      success: true,
      message: 'Automated test field updated',
      automated_test,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
