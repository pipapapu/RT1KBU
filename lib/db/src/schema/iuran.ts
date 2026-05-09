import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { wargaTable } from "./warga";

export const iuranStatusEnum = pgEnum("iuran_status", ["belum_bayar", "menunggu_verifikasi", "lunas"]);

export const iuranTable = pgTable("iuran", {
  id: serial("id").primaryKey(),
  wargaId: integer("warga_id").notNull().references(() => wargaTable.id),
  bulan: integer("bulan").notNull(),
  tahun: integer("tahun").notNull(),
  jumlah: integer("jumlah").notNull(),
  status: iuranStatusEnum("status").default("belum_bayar").notNull(),
  buktiBayarUrl: text("bukti_bayar_url"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertIuranSchema = createInsertSchema(iuranTable).omit({ id: true, createdAt: true });
export type InsertIuran = z.infer<typeof insertIuranSchema>;
export type Iuran = typeof iuranTable.$inferSelect;
