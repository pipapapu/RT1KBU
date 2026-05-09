import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { kartuKeluargaTable } from "./kartuKeluarga";

export const wargaTable = pgTable("warga", {
  id: serial("id").primaryKey(),
  kkId: integer("kk_id").notNull().references(() => kartuKeluargaTable.id),
  namaLengkap: text("nama_lengkap").notNull(),
  nik: text("nik").notNull().unique(),
  tempatLahir: text("tempat_lahir"),
  tanggalLahir: text("tanggal_lahir"),
  namaOrangTua: text("nama_orang_tua"),
  nomorRumah: text("nomor_rumah").notNull(),
  nomorTelepon: text("nomor_telepon"),
  clerkUserId: text("clerk_user_id"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWargaSchema = createInsertSchema(wargaTable).omit({ id: true, createdAt: true });
export type InsertWarga = z.infer<typeof insertWargaSchema>;
export type Warga = typeof wargaTable.$inferSelect;
