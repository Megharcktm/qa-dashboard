import express, { Router, Request, Response, NextFunction } from 'express';
import { DevRevService } from '../services/devrev.service';
import { DatabaseService } from '../services/database.service';

const router: Router = express.Router();

interface SyncRequest extends Request {
  body: {
    force?: boolean;
  };
}

// POST /api/sync/trigger - Trigger a manual sync
router.post('/trigger', async (req: SyncRequest, res: Response, next: NextFunction) => {
  try {
    const devRevService: DevRevService = req.app.locals.devRevService;
    const dbService: DatabaseService = req.app.locals.dbService;

    const { force } = req.body;

    console.log('Sync triggered...' + (force ? ' (force)' : ''));

    // Record sync start
    const syncRecord = dbService.recordSync({
      status: 'in_progress',
    });

    try {
      // Fetch all works from DevRev
      let insertCount = 0;
      let updateCount = 0;

      await devRevService.fetchIssuesAndTickets((count, cursor) => {
        console.log(`  Progress: ${count} works fetched${cursor ? ' (more available)' : ' (done)'}`);
      });

      // Fetch and store all tickets
      const works = await devRevService.fetchIssuesAndTickets();

      console.log(`Starting to store ${works.length} tickets...`);

      // Use a transaction for better performance
      const transaction = req.app.locals.db.transaction(() => {
        // If force, clear existing data
        if (force) {
          dbService.clearTickets();
          console.log('  Cleared existing tickets');
        }

        // Upsert each work
        for (const work of works) {
          try {
            dbService.upsertTicket(work);
            // Can't easily track insert vs update with SQLite, so count as updates
            updateCount++;
          } catch (error) {
            console.error(`Error upserting ticket ${work.id}:`, error);
          }
        }
      });

      // Execute transaction
      transaction();

      console.log(`✓ Stored ${updateCount} tickets`);

      // Update sync record
      dbService.completeSyncRecord(syncRecord.id, {
        status: 'success',
        totalInserted: insertCount,
        totalUpdated: updateCount,
      });

      res.json({
        success: true,
        message: 'Sync completed',
        syncId: syncRecord.id,
        totalFetched: works.length,
        totalStored: updateCount,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Sync failed:', errorMessage);

      // Update sync record with error
      dbService.completeSyncRecord(syncRecord.id, {
        status: 'failed',
        errorMessage,
      });

      res.status(500).json({
        error: true,
        message: 'Sync failed',
        syncId: syncRecord.id,
        errorMessage,
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/sync/status/:syncId - Get sync status
router.get('/status/:syncId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const { syncId } = req.params;

    const syncRecord = dbService.getSyncStatus(parseInt(syncId));

    if (!syncRecord) {
      return res.status(404).json({
        error: true,
        message: 'Sync record not found',
      });
    }

    res.json({
      id: syncRecord.id,
      status: syncRecord.status,
      startedAt: syncRecord.sync_started_at,
      completedAt: syncRecord.sync_completed_at,
      totalFetched: syncRecord.total_fetched,
      totalInserted: syncRecord.total_inserted,
      totalUpdated: syncRecord.total_updated,
      errorMessage: syncRecord.error_message,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sync/history - Get sync history
router.get('/history', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const limit = parseInt(req.query.limit as string) || 10;

    const history = dbService.getSyncHistory(limit);

    res.json({
      history: history.map(record => ({
        id: record.id,
        status: record.status,
        startedAt: record.sync_started_at,
        completedAt: record.sync_completed_at,
        totalFetched: record.total_fetched,
        totalInserted: record.total_inserted,
        totalUpdated: record.total_updated,
        errorMessage: record.error_message,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
