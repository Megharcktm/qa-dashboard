import express, { Router, Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../services/database.service';

const router: Router = express.Router();

// GET /api/automation-plans - Get all automation plans
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const plans = dbService.getAutomationPlans();

    res.json({ data: plans });
  } catch (error) {
    console.error('Error getting automation plans:', error);
    next(error);
  }
});

// GET /api/automation-plans/month/:monthYear - Get plans for a specific month
router.get('/month/:monthYear', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const { monthYear } = req.params;
    const plans = dbService.getAutomationPlansByMonth(monthYear);

    res.json({ data: plans, monthYear });
  } catch (error) {
    console.error('Error getting monthly automation plans:', error);
    next(error);
  }
});

// GET /api/automation-plans/status-distribution/:monthYear - Get status distribution for a month
router.get('/status-distribution/:monthYear', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const { monthYear } = req.params;
    const distribution = dbService.getAutomationStatusDistribution(monthYear);

    res.json({ data: distribution, monthYear });
  } catch (error) {
    console.error('Error getting automation status distribution:', error);
    next(error);
  }
});

// POST /api/automation-plans - Create a new automation plan
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const plan = req.body;

    if (!plan.feature_name) {
      return res.status(400).json({
        error: true,
        message: 'feature_name is required',
      });
    }

    dbService.addAutomationPlan(plan);

    res.json({
      success: true,
      message: 'Automation plan created',
    });
  } catch (error) {
    console.error('Error creating automation plan:', error);
    next(error);
  }
});

// POST /api/automation-plans/bulk - Bulk import automation plans
router.post('/bulk', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const plans = req.body.plans || [];

    if (!Array.isArray(plans)) {
      return res.status(400).json({
        error: true,
        message: 'plans must be an array',
      });
    }

    plans.forEach((plan: any) => {
      if (plan.feature_name) {
        dbService.addAutomationPlan(plan);
      }
    });

    res.json({
      success: true,
      message: `${plans.length} automation plans imported`,
      count: plans.length,
    });
  } catch (error) {
    console.error('Error bulk importing automation plans:', error);
    next(error);
  }
});

// PUT /api/automation-plans/:id - Update an automation plan
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const { id } = req.params;
    const plan = req.body;

    dbService.updateAutomationPlan(parseInt(id), plan);

    res.json({
      success: true,
      message: 'Automation plan updated',
    });
  } catch (error) {
    console.error('Error updating automation plan:', error);
    next(error);
  }
});

// DELETE /api/automation-plans/:id - Delete an automation plan
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService: DatabaseService = req.app.locals.dbService;
    const { id } = req.params;

    dbService.deleteAutomationPlan(parseInt(id));

    res.json({
      success: true,
      message: 'Automation plan deleted',
    });
  } catch (error) {
    console.error('Error deleting automation plan:', error);
    next(error);
  }
});

export default router;
