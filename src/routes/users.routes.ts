import { Router, type Response, type IRouter } from 'express';
import { authenticateToken, requireAdmin, type AuthRequest } from '../middleware/auth.middleware.js';
import { UserModel } from '../models/user.model.js';
import { AuditLogModel } from '../models/audit-log.model.js';
import argon2 from 'argon2';
import { z } from 'zod';
import { UserRole, ActionType } from '../types/auth.js';

const router: IRouter = Router();

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await UserModel.getAll();

    res.json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (Admin only)
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['editor']),
});

router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const data = createUserSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(data.email);
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await argon2.hash(data.password);

    // Create user
    const newUser = await UserModel.create({
      email: data.email,
      password: hashedPassword,
      role: data.role as UserRole,
    });

    // Log the action
    await AuditLogModel.create({
      userId: req.user.userId,
      action: ActionType.CREATE,
      resourceType: 'user',
      resourceId: newUser.id,
      details: { email: newUser.email, role: newUser.role },
    });

    res.json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role (Admin only)
const updateRoleSchema = z.object({
  role: z.enum(['editor']),
});

router.patch('/:id/role', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    
    const data = updateRoleSchema.parse(req.body);

    // Check if user exists
    const user = await UserModel.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent changing admin role
    if (user.role === UserRole.ADMIN) {
      res.status(403).json({ error: 'Cannot change admin role' });
      return;
    }

    // Update role
    await UserModel.updateRole(id, data.role as UserRole);

    // Log the action
    await AuditLogModel.create({
      userId: req.user.userId,
      action: ActionType.UPDATE,
      resourceType: 'user',
      resourceId: id,
      details: { oldRole: user.role, newRole: data.role },
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Activate/Deactivate user (Admin only)
const toggleActiveSchema = z.object({
  isActive: z.boolean(),
});

router.patch('/:id/active', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }
    
    const data = toggleActiveSchema.parse(req.body);

    // Check if user exists
    const user = await UserModel.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent deactivating admin
    if (user.role === UserRole.ADMIN) {
      res.status(403).json({ error: 'Cannot deactivate admin' });
      return;
    }

    // Prevent deactivating self
    if (id === req.user.userId) {
      res.status(403).json({ error: 'Cannot deactivate your own account' });
      return;
    }

    // Toggle active status
    await UserModel.toggleActive(id, data.isActive);

    // Log the action
    await AuditLogModel.create({
      userId: req.user.userId,
      action: ActionType.UPDATE,
      resourceType: 'user',
      resourceId: id,
      details: { action: data.isActive ? 'activated' : 'deactivated' },
    });

    res.json({
      success: true,
      message: `User ${data.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.issues });
      return;
    }
    console.error('Toggle user active error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Check if user exists
    const user = await UserModel.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent deleting admin
    if (user.role === UserRole.ADMIN) {
      res.status(403).json({ error: 'Cannot delete admin' });
      return;
    }

    // Prevent deleting self
    if (id === req.user.userId) {
      res.status(403).json({ error: 'Cannot delete your own account' });
      return;
    }

    // Delete user
    await UserModel.deleteById(id);

    // Log the action
    await AuditLogModel.create({
      userId: req.user.userId,
      action: ActionType.DELETE,
      resourceType: 'user',
      resourceId: id,
      details: { email: user.email, role: user.role },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
