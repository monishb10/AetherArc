import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const players=sqliteTable('aether_players',{id:text('id').primaryKey(),state:text('state').notNull(),version:integer('version').notNull().default(0),updatedAt:integer('updated_at').notNull()});
