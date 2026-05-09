import { Router } from "express";
import { db, wargaTable, kartuKeluargaTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  ListWargaQueryParams,
  CreateWargaBody,
  UpdateWargaBody,
  GetWargaParams,
  UpdateWargaParams,
  DeleteWargaParams,
  LinkWargaUserBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/warga", async (req, res): Promise<void> => {
  const query = ListWargaQueryParams.safeParse({
    search: req.query.search,
    kkId: req.query.kkId ? Number(req.query.kkId) : undefined,
  });
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let rows = await db
    .select({
      id: wargaTable.id,
      kkId: wargaTable.kkId,
      namaLengkap: wargaTable.namaLengkap,
      nik: wargaTable.nik,
      tempatLahir: wargaTable.tempatLahir,
      tanggalLahir: wargaTable.tanggalLahir,
      namaOrangTua: wargaTable.namaOrangTua,
      nomorRumah: wargaTable.nomorRumah,
      nomorTelepon: wargaTable.nomorTelepon,
      clerkUserId: wargaTable.clerkUserId,
      isActive: wargaTable.isActive,
      createdAt: wargaTable.createdAt,
      kkNomor: kartuKeluargaTable.nomorKK,
    })
    .from(wargaTable)
    .leftJoin(kartuKeluargaTable, eq(wargaTable.kkId, kartuKeluargaTable.id))
    .orderBy(wargaTable.nomorRumah);

  if (query.data.kkId) {
    rows = rows.filter((r) => r.kkId === query.data.kkId);
  }
  if (query.data.search) {
    const s = query.data.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.namaLengkap.toLowerCase().includes(s) ||
        r.nomorRumah.toLowerCase().includes(s),
    );
  }

  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/warga", async (req, res): Promise<void> => {
  const body = CreateWargaBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [created] = await db.insert(wargaTable).values(body.data).returning();
  res.status(201).json({ ...created, createdAt: created.createdAt.toISOString(), kkNomor: null });
});

router.get("/warga/me", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [row] = await db
    .select({
      id: wargaTable.id,
      namaLengkap: wargaTable.namaLengkap,
      nomorRumah: wargaTable.nomorRumah,
      clerkUserId: wargaTable.clerkUserId,
    })
    .from(wargaTable)
    .where(eq(wargaTable.clerkUserId, userId));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.post("/warga/link-user", async (req, res): Promise<void> => {
  const body = LinkWargaUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [updated] = await db
    .update(wargaTable)
    .set({ clerkUserId: body.data.clerkUserId })
    .where(eq(wargaTable.id, body.data.wargaId))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString(), kkNomor: null });
});

router.get("/warga/:id", async (req, res): Promise<void> => {
  const params = GetWargaParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select({
      id: wargaTable.id,
      kkId: wargaTable.kkId,
      namaLengkap: wargaTable.namaLengkap,
      nik: wargaTable.nik,
      tempatLahir: wargaTable.tempatLahir,
      tanggalLahir: wargaTable.tanggalLahir,
      namaOrangTua: wargaTable.namaOrangTua,
      nomorRumah: wargaTable.nomorRumah,
      nomorTelepon: wargaTable.nomorTelepon,
      clerkUserId: wargaTable.clerkUserId,
      isActive: wargaTable.isActive,
      createdAt: wargaTable.createdAt,
      kkNomor: kartuKeluargaTable.nomorKK,
    })
    .from(wargaTable)
    .leftJoin(kartuKeluargaTable, eq(wargaTable.kkId, kartuKeluargaTable.id))
    .where(eq(wargaTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/warga/:id", async (req, res): Promise<void> => {
  const params = UpdateWargaParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateWargaBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [updated] = await db
    .update(wargaTable)
    .set(body.data)
    .where(eq(wargaTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString(), kkNomor: null });
});

router.delete("/warga/:id", async (req, res): Promise<void> => {
  const params = DeleteWargaParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(wargaTable).where(eq(wargaTable.id, params.data.id));
  res.json({ success: true });
});

export default router;
