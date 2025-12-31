import { db } from '../db/index.js';
import { pendingChanges } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { ActionType, ChangeStatus } from '../types/auth.js';

export interface CreatePendingChangeData {
  userId: string;
  action: ActionType;
  resourceType: string;
  resourceId?: string | undefined;
  changeData: any;
  previousData?: any;
}

export interface ReviewPendingChangeData {
  reviewedBy: string;
  status: ChangeStatus;
  reviewNotes?: string | undefined;
}

export class PendingChangeModel {
  static async create(data: CreatePendingChangeData) {
    const result = await db.insert(pendingChanges).values({
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      changeData: data.changeData,
      previousData: data.previousData,
      status: 'pending',
    }).returning();

    return result[0]!;
  }

  static async getById(id: string) {
    const result = await db
      .select()
      .from(pendingChanges)
      .where(eq(pendingChanges.id, id))
      .limit(1);

    return result[0] || null;
  }

  static async getAllPending() {
    return await db
      .select()
      .from(pendingChanges)
      .where(eq(pendingChanges.status, 'pending'))
      .orderBy(desc(pendingChanges.createdAt));
  }

  static async getByUserId(userId: string) {
    return await db
      .select()
      .from(pendingChanges)
      .where(eq(pendingChanges.userId, userId))
      .orderBy(desc(pendingChanges.createdAt));
  }

  static async getByStatus(status: ChangeStatus) {
    return await db
      .select()
      .from(pendingChanges)
      .where(eq(pendingChanges.status, status))
      .orderBy(desc(pendingChanges.createdAt));
  }

  static async review(id: string, reviewData: ReviewPendingChangeData) {
    const result = await db
      .update(pendingChanges)
      .set({
        status: reviewData.status,
        reviewedBy: reviewData.reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: reviewData.reviewNotes,
        updatedAt: new Date(),
      })
      .where(eq(pendingChanges.id, id))
      .returning();

    return result[0] || null;
  }

  static async delete(id: string) {
    const result = await db
      .delete(pendingChanges)
      .where(eq(pendingChanges.id, id))
      .returning();

    return result.length > 0;
  }
}
