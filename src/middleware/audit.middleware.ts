import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware.js';
import { AuditLogModel } from '../models/audit-log.model.js';
import { ActionType } from '../types/auth.js';

export const auditLog = (action: ActionType, resourceType?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        const ipAddress = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0]?.trim();
        const userAgent = req.headers['user-agent'] || '';

        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to capture response
        res.json = function (data: any) {
          // Log after successful response
          if (res.statusCode < 400) {
            const resourceId = req.params.id || data?.id || data?.data?.id;
            
            AuditLogModel.create({
              userId: req.user!.userId,
              action,
              resourceType,
              resourceId,
              details: {
                method: req.method,
                path: req.path,
                body: req.body,
                query: req.query,
                params: req.params,
              },
              ipAddress,
              userAgent,
            }).catch(error => {
              console.error('Failed to create audit log:', error);
            });
          }

          return originalJson(data);
        };
      }

      next();
    } catch (error) {
      console.error('Audit middleware error:', error);
      next();
    }
  };
};
