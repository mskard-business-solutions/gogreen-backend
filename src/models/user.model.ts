import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { type User, UserRole } from '../types/auth.js';

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (result.length === 0) {
      return null;
    }

    const user = result[0]!;
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      role: user.role as UserRole,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async findById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (result.length === 0) {
      return null;
    }

    const user = result[0]!;
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      role: user.role as UserRole,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async create(userData: { email: string; password: string; role: UserRole }): Promise<User> {
    const result = await db.insert(users).values({
      email: userData.email,
      password: userData.password,
      role: userData.role,
      isActive: true,
    }).returning();

    const newUser = result[0]!;
    return {
      id: newUser.id,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role as UserRole,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };
  }

  static async updatePassword(userId: string, hashedPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return result.length > 0;
  }

  static async getAll(): Promise<Omit<User, 'password'>[]> {
    const result = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users);

    return result.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  static async updateRole(userId: string, role: UserRole): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return result.length > 0;
  }

  static async toggleActive(userId: string, isActive: boolean): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return result.length > 0;
  }

  static async deleteById(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }
}
