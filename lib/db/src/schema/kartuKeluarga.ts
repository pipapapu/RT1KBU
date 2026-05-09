import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const kartuKeluargaTable = pgTable("kartu_keluarga", {
  id: serial("id").primaryKey(),
  nomorKK: text("nomor_kk").notNull().unique(),
  nomorRumah: text("nomor_rumah").notNull(),
  namaKepalaKeluarga: text("nama_kepala_keluarga").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertKartuKeluargaSchema = createInsertSchema(kartuKeluargaTable).omit({ id: true, createdAt: true });
export type InsertKartuKeluarga = z.infer<typeof insertKartuKeluargaSchema>;
export type KartuKeluarga = typeof kartuKeluargaTable.$inferSelect;
