import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

export interface Product {
  id: string;
  subcategoryId: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: string | null;
  images: string[] | null;
  specifications: any | null;
  features: string[] | null;
  displayOrder: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductModel {
  static async create(data: {
    subcategoryId: string;
    name: string;
    slug: string;
    description?: string | undefined;
    shortDescription?: string | undefined;
    price?: string | undefined;
    images?: string[] | undefined;
    specifications?: any;
    features?: string[] | undefined;
    displayOrder?: string | undefined;
    isFeatured?: boolean | undefined;
  }): Promise<Product> {
    const result = await db.insert(products).values(data).returning();
    return result[0]!;
  }

  static async getAll(includeInactive = false): Promise<Product[]> {
    if (includeInactive) {
      return await db.select().from(products).orderBy(desc(products.displayOrder));
    }
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.displayOrder));
  }

  static async getById(id: string): Promise<Product | null> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result.length > 0 ? result[0]! : null;
  }

  static async getBySlug(slug: string): Promise<Product | null> {
    const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    return result.length > 0 ? result[0]! : null;
  }

  static async getBySubcategoryId(subcategoryId: string, includeInactive = false): Promise<Product[]> {
    if (includeInactive) {
      return await db.select().from(products).where(eq(products.subcategoryId, subcategoryId)).orderBy(desc(products.displayOrder));
    }
    return await db
      .select()
      .from(products)
      .where(and(eq(products.subcategoryId, subcategoryId), eq(products.isActive, true)))
      .orderBy(desc(products.displayOrder));
  }

  static async getFeatured(limit = 10): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.isFeatured, true), eq(products.isActive, true)))
      .orderBy(desc(products.displayOrder))
      .limit(limit);
  }

  static async update(id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null> {
    const result = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return result.length > 0 ? result[0]! : null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  static async toggleActive(id: string, isActive: boolean): Promise<boolean> {
    const result = await db
      .update(products)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return result.length > 0;
  }

  static async toggleFeatured(id: string, isFeatured: boolean): Promise<boolean> {
    const result = await db
      .update(products)
      .set({ isFeatured, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return result.length > 0;
  }
}
