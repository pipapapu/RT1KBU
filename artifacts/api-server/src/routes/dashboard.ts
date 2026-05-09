import { Router } from "express";
import { db, wargaTable, kartuKeluargaTable, iuranTable, suratTable } from "@workspace/db";
import { eq, and, count, sum } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [wargaCount] = await db.select({ count: count() }).from(wargaTable).where(eq(wargaTable.isActive, true));
  const [kkCount] = await db.select({ count: count() }).from(kartuKeluargaTable);

  const allIuranThisMonth = await db
    .select()
    .from(iuranTable)
    .where(and(eq(iuranTable.bulan, currentMonth), eq(iuranTable.tahun, currentYear)));

  const lunas = allIuranThisMonth.filter((i) => i.status === "lunas");
  const belumBayar = allIuranThisMonth.filter((i) => i.status === "belum_bayar");
  const menunggu = allIuranThisMonth.filter((i) => i.status === "menunggu_verifikasi");

  const allLunasIuran = await db.select().from(iuranTable).where(eq(iuranTable.status, "lunas"));
  const totalPemasukan = allLunasIuran.reduce((acc, i) => acc + i.jumlah, 0);

  const [suratBaru] = await db.select({ count: count() }).from(suratTable).where(eq(suratTable.status, "diajukan"));

  res.json({
    totalWarga: wargaCount.count,
    totalKK: kkCount.count,
    iuranLunasBulanIni: lunas.length,
    iuranBelumBayar: belumBayar.length,
    iuranMenungguVerifikasi: menunggu.length,
    suratBaru: suratBaru.count,
    totalPemasukan,
  });
});

router.get("/dashboard/pending-actions", async (req, res): Promise<void> => {
  const [menungguVerifikasi] = await db
    .select({ count: count() })
    .from(iuranTable)
    .where(eq(iuranTable.status, "menunggu_verifikasi"));

  const [permohonanSurat] = await db
    .select({ count: count() })
    .from(suratTable)
    .where(eq(suratTable.status, "diajukan"));

  res.json({
    buktiPembayaran: menungguVerifikasi.count,
    permohonanSurat: permohonanSurat.count,
  });
});

export default router;
