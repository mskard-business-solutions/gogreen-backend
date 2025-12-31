import { Router, type Response, type IRouter } from 'express';
import { authenticateToken, requireAdmin, type AuthRequest } from '../middleware/auth.middleware.js';
import { AuditLogModel } from '../models/audit-log.model.js';
import { z } from 'zod';
import { ActionType } from '../types/auth.js';

const router: IRouter = Router();

// Get all audit logs (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, action, resourceType, startDate, endDate, limit } = req.query;

    const options: any = {};
    if (userId) options.userId = userId as string;
    if (action) options.action = action as ActionType;
    if (resourceType) options.resourceType = resourceType as string;
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);
    if (limit) options.limit = parseInt(limit as string);

    const logs = await AuditLogModel.getAll(options);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit logs for a specific user
router.get('/user/:userId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const logs = await AuditLogModel.getByUserId(userId, limit);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error) {
    console.error('Get user audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit logs for a specific resource
router.get('/resource/:resourceId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resourceId } = req.params;
    
    if (!resourceId) {
      res.status(400).json({ error: 'Resource ID is required' });
      return;
    }

    const logs = await AuditLogModel.getByResourceId(resourceId);

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error) {
    console.error('Get resource audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
