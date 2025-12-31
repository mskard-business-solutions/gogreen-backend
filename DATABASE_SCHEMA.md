# Database Schema Documentation

## Overview
The authentication system uses PostgreSQL with Drizzle ORM for type-safe database operations.

## Tables

### `users`
Stores user authentication and profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT random | Unique user identifier |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | User's email address (used for login) |
| `password` | VARCHAR(255) | NOT NULL | Argon2 hashed password |
| `role` | ENUM('admin', 'editor') | NOT NULL, DEFAULT 'editor' | User's role for authorization |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

## Enums

### `user_role`
- `admin`: Full administrative access
- `editor`: Content editing access

## Database Commands

### Generate Migration
```bash
pnpm db:generate
```
Generates SQL migration files from schema changes.

### Run Migrations
```bash
pnpm db:migrate
```
Applies pending migrations to the database.

### Push Schema (Development)
```bash
pnpm db:push
```
Directly pushes schema changes without creating migration files. Useful for rapid development.

### Seed Database
```bash
pnpm db:seed
```
Seeds the database with default admin and editor users.

### Drizzle Studio (Database GUI)
```bash
pnpm db:studio
```
Opens Drizzle Studio web interface for database management at `https://local.drizzle.studio`

## Initial Setup

1. Create the database:
```sql
CREATE DATABASE gogreen;
```

2. Configure environment variables in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=khush
DB_PASSWORD=khush123
DB_NAME=gogreen
```

3. Push the schema to database:
```bash
pnpm db:push
```

4. Seed with default users:
```bash
pnpm db:seed
```

## Schema Files

- `/src/db/schema.ts` - Drizzle ORM schema definition
- `/src/db/index.ts` - Database connection and instance
- `/src/db/seed.ts` - Database seeding script
- `/drizzle.config.ts` - Drizzle Kit configuration
- `/drizzle/` - Generated migration files (created after running `pnpm db:generate`)

## Indexes

The following indexes are automatically created:
- Primary key index on `id`
- Unique index on `email`

## Future Enhancements

Consider adding these tables/columns for enhanced functionality:

### Password Reset Tokens
```typescript
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Session Management
```typescript
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Audit Log
```typescript
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }),
  resourceId: varchar('resource_id', { length: 255 }),
  metadata: json('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```
