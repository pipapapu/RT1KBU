import { Router } from "express";
import { db, iuranTable, wargaTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  ListIuranQueryParams,
  CreateIuranBody,
  GenerateMonthlyIuranBody,
  GetIuranParams,
  UpdateIuranStatusParams,
  UpdateIuranStatusBody,
  UploadBuktiBayarParams,
  UploadBuktiBayarBody,
} from "@workspace/api-zod";

const router = Router();

function formatIuran(r: any) {
  return {
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    verifiedAt: r.verifiedAt instanceof Date ? r.verifiedAt.toISOString() : r.verifiedAt,
  };
}

router.get("/iuran", async (req, res): Promise<void> => {
  const query = ListIuranQueryParams.safeParse({
    wargaId: req.query.wargaId ? Number(req.query.wargaId) : undefined,
    status: req.query.status,
    tahun: req.query.tahun ? Number(req.query.tahun) : undefined,
    bulan: req.query.bulan ? Number(req.query.bulan) : undefined,
  });
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let rows = await db
    .select({
      id: iuranTable.id,
      wargaId: iuranTable.wargaId,
      bulan: iuranTable.bulan,
      tahun: iuranTable.tahun,
      jumlah: iuranTable.jumlah,
      status: iuranTable.status,
      buktiBayarUrl: iuranTable.buktiBayarUrl,
      createdAt: iuranTable.createdAt,
      verifiedAt: iuranTable.verifiedAt,
      verifiedBy: iuranTable.verifiedBy,
      namaWarga: wargaTable.namaLengkap,
      nomorRumah: wargaTable.nomorRumah,
    })
    .from(iuranTable)
    .leftJoin(wargaTable, eq(iuranTable.wargaId, wargaTable.id))
    .orderBy(iuranTable.tahun, iuranTable.bulan);

  const { wargaId, status, tahun, bulan } = query.data;
  if (wargaId) rows = rows.filter((r) => r.wargaId === wargaId);
  if (status) rows = rows.filter((r) => r.status === status);
  if (tahun) rows = rows.filter((r) => r.tahun === tahun);
  if (bulan) rows = rows.filter((r) => r.bulan === bulan);

  res.json(rows.map(formatIuran));
});

router.post("/iuran", async (req, res): Promise<void> => {
  const body = CreateIuranBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [created] = await db.insert(iuranTable).values(body.data).returning();
  res.status(201).json(formatIuran({ ...created, namaWarga: null, nomorRumah: null }));
});

router.post("/iuran/generate-monthly", async (req, res): Promise<void> => {
  const body = GenerateMonthlyIuranBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { bulan, tahun, jumlah } = body.data;

  const allWarga = await db.select().from(wargaTable).where(eq(wargaTable.isActive, true));
  const existing = await db
    .select()
    .from(iuranTable)
    .where(and(eq(iuranTable.bulan, bulan), eq(iuranTable.tahun, tahun)));
  const existingWargaIds = new Set(existing.map((e) => e.wargaId));

  const toCreate = allWarga.filter((w) => !existingWargaIds.has(w.id));
  if (toCreate.length > 0) {
    await db.insert(iuranTable).values(
      toCreate.map((w) => ({ wargaId: w.id, bulan, tahun, jumlah, status: "belum_bayar" as const })),
    );
  }

  res.json({ created: toCreate.length, skipped: existing.length });
});

router.get("/iuran/my", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [warga] = await db.select().from(wargaTable).where(eq(wargaTable.clerkUserId, userId));
  if (!warga) {
    res.json([]);
    return;
  }
  const rows = await db
    .select({
      id: iuranTable.id,
      wargaId: iuranTable.wargaId,
      bulan: iuranTable.bulan,
      tahun: iuranTable.tahun,
      jumlah: iuranTable.jumlah,
      status: iuranTable.status,
      buktiBayarUrl: iuranTable.buktiBayarUrl,
      createdAt: iuranTable.createdAt,
      verifiedAt: iuranTable.verifiedAt,
      verifiedBy: iuranTable.verifiedBy,
      namaWarga: wargaTable.namaLengkap,
      nomorRumah: wargaTable.nomorRumah,
    })
    .from(iuranTable)
    .leftJoin(wargaTable, eq(iuranTable.wargaId, wargaTable.id))
    .where(eq(iuranTable.wargaId, warga.id))
    .orderBy(iuranTable.tahun, iuranTable.bulan);

  res.json(rows.map(formatIuran));
});

router.get("/iuran/:id", async (req, res): Promise<void> => {
  const params = GetIuranParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select({
      id: iuranTable.id,
      wargaId: iuranTable.wargaId,
      bulan: iuranTable.bulan,
      tahun: iuranTable.tahun,
      jumlah: iuranTable.jumlah,
      status: iuranTable.status,
      buktiBayarUrl: iuranTable.buktiBayarUrl,
      createdAt: iuranTable.createdAt,
      verifiedAt: iuranTable.verifiedAt,
      verifiedBy: iuranTable.verifiedBy,
      namaWarga: wargaTable.namaLengkap,
      nomorRumah: wargaTable.nomorRumah,
    })
    .from(iuranTable)
    .leftJoin(wargaTable, eq(iuranTable.wargaId, wargaTable.id))
    .where(eq(iuranTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatIuran(row));
});

router.patch("/iuran/:id", async (req, res): Promise<void> => {
  const params = UpdateIuranStatusParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateIuranStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { userId } = getAuth(req);
  const updateData: any = { status: body.data.status };
  if (body.data.status === "lunas") {
    updateData.verifiedAt = new Date();
    updateData.verifiedBy = userId ?? "admin";
  }
  const [updated] = await db
    .update(iuranTable)
    .set(updateData)
    .where(eq(iuranTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatIuran({ ...updated, namaWarga: null, nomorRumah: null }));
});

router.post("/iuran/:id/bukti-bayar", async (req, res): Promise<void> => {
  const params = UploadBuktiBayarParams.safeParse({ id: Number(req.params.id) });
  const body = UploadBuktiBayarBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [updated] = await db
    .update(iuranTable)
    .set({ buktiBayarUrl: body.data.buktiBayarUrl, status: "menunggu_verifikasi" })
    .where(eq(iuranTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatIuran({ ...updated, namaWarga: null, nomorRumah: null }));
});

export default router;
