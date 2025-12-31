import { db } from '../db/index.js';
import { auditLogs } from '../db/schema.js';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { ActionType } from '../types/auth.js';

export interface CreateAuditLogData {
  userId: string;
  action: ActionType;
  resourceType?: string | undefined;
  resourceId?: string | undefined;
  details?: any;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export class AuditLogModel {
  static async create(data: CreateAuditLogData) {
    const result = await db.insert(auditLogs).values({
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    }).returning();

    return result[0]!;
  }

  static async getAll(options?: {
    userId?: string;
    action?: ActionType;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    let query = db.select().from(auditLogs);

    const conditions = [];
    if (options?.userId) conditions.push(eq(auditLogs.userId, options.userId));
    if (options?.action) conditions.push(eq(auditLogs.action, options.action));
    if (options?.resourceType) conditions.push(eq(auditLogs.resourceType, options.resourceType));
    if (options?.startDate) conditions.push(gte(auditLogs.createdAt, options.startDate));
    if (options?.endDate) conditions.push(lte(auditLogs.createdAt, options.endDate));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(auditLogs.createdAt)) as any;

    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }

    return await query;
  }

  static async getByUserId(userId: string, limit: number = 50) {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  static async getByResourceId(resourceId: string) {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.resourceId, resourceId))
      .orderBy(desc(auditLogs.createdAt));
  }
}
