import { Router, type Response, type IRouter } from 'express';
import { authenticateToken, requireAdmin, requireEditor, type AuthRequest } from '../middleware/auth.middleware.js';
import { PendingChangeModel } from '../models/pending-change.model.js';
import { AuditLogModel } from '../models/audit-log.model.js';
import { z } from 'zod';
import { ActionType, ChangeStatus, UserRole } from '../types/auth.js';

const router: IRouter = Router();

// Create a pending change (Admins and Editors)
const createChangeSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  resourceType: z.string(),
  resourceId: z.string().optional(),
  changeData: z.any(),
  previousData: z.any().optional(),
});

router.post('/', authenticateToken, requireEditor, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Super admins don't need approval
    if (req.user.role === UserRole.ADMIN) {
      res.status(400).json({ error: 'Super admins do not need approval for changes' });
      return;
    }

    const data = createChangeSchema.parse(req.body);

    const pendingChange = await PendingChangeModel.create({
      userId: req.user.userId,
      action: data.action as ActionType,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      changeData: data.changeData,
      previousData: data.previousData,
    });

    // Log the action
    await AuditLogModel.create({
      userId: req.user.userId,
      action: ActionType.CREATE,
      resourceType: 'pending_change',
      resourceId: pendingChange.id,
      details: { changeType: data.action, targetResource: data.resourceType },
    });

    res.json({
      success: true,
      message: 'Change submitted for approval',
      data: pendingChange,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Create pending change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all pending changes (Admin only)
router.get('/pending', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pendingChanges = await PendingChangeModel.getAllPending();

    res.json({
      success: true,
      data: pendingChanges,
      total: pendingChanges.length,
    });
  } catch (error) {
    console.error('Get pending changes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's pending changes
router.get('/my-changes', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const changes = await PendingChangeModel.getByUserId(req.user.userId);

    res.json({
      success: true,
      data: changes,
      total: changes.length,
    });
  } catch (error) {
    console.error('Get my changes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get changes by status
router.get('/status/:status', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.params;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const changes = await PendingChangeModel.getByStatus(status as ChangeStatus);

    res.json({
      success: true,
      data: changes,
      total: changes.length,
    });
  } catch (error) {
    console.error('Get changes by status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Review a pending change (Admin only)
const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().optional(),
});

router.post('/:id/review', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Change ID is required' });
      return;
    }
    
    const data = reviewSchema.parse(req.body);

    // Get the pending change
    const pendingChange = await PendingChangeModel.getById(id);
    if (!pendingChange) {
      res.status(404).json({ error: 'Pending change not found' });
      return;
    }

    if (pendingChange.status !== 'pending') {
      res.status(400).json({ error: 'This change has already been reviewed' });
      return;
    }

    // Review the change
    const reviewed = await PendingChangeModel.review(id, {
      reviewedBy: req.user.userId,
      status: data.status as ChangeStatus,
      reviewNotes: data.reviewNotes,
    });

    // Log the review action
    await AuditLogModel.create({
      userId: req.user.userId,
      action: data.status === 'approved' ? ActionType.APPROVE : ActionType.REJECT,
      resourceType: 'pending_change',
      resourceId: id,
      details: {
        originalAction: pendingChange.action,
        targetResource: pendingChange.resourceType,
        reviewNotes: data.reviewNotes,
      },
    });

    res.json({
      success: true,
      message: `Change ${data.status}`,
      data: reviewed,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Review pending change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
