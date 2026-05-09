import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pengumumanTable = pgTable("pengumuman", {
  id: serial("id").primaryKey(),
  judul: text("judul").notNull(),
  konten: text("konten").notNull(),
  kategori: text("kategori"),
  authorId: text("author_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPengumumanSchema = createInsertSchema(pengumumanTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPengumuman = z.infer<typeof insertPengumumanSchema>;
export type Pengumuman = typeof pengumumanTable.$inferSelect;
