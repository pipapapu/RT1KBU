import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const suratStatusEnum = pgEnum("surat_status", ["diajukan", "diproses", "selesai"]);

export const suratTable = pgTable("surat", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id"),
  namaLengkap: text("nama_lengkap").notNull(),
  nomorRumah: text("nomor_rumah"),
  jenisSurat: text("jenis_surat").notNull(),
  alasan: text("alasan").notNull(),
  status: suratStatusEnum("status").default("diajukan").notNull(),
  catatanAdmin: text("catatan_admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSuratSchema = createInsertSchema(suratTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSurat = z.infer<typeof insertSuratSchema>;
export type Surat = typeof suratTable.$inferSelect;
