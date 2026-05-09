import { Router } from "express";
import { db, kartuKeluargaTable, wargaTable } from "@workspace/db";
import { eq, ilike, sql } from "drizzle-orm";
import {
  ListKKQueryParams,
  CreateKKBody,
  UpdateKKBody,
  GetKKParams,
  UpdateKKParams,
  DeleteKKParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/kk", async (req, res): Promise<void> => {
  const query = ListKKQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { search } = query.data;
  let rows = await db
    .select({
      id: kartuKeluargaTable.id,
      nomorKK: kartuKeluargaTable.nomorKK,
      nomorRumah: kartuKeluargaTable.nomorRumah,
      namaKepalaKeluarga: kartuKeluargaTable.namaKepalaKeluarga,
      createdAt: kartuKeluargaTable.createdAt,
      wargaCount: sql<number>`count(${wargaTable.id})`.mapWith(Number),
    })
    .from(kartuKeluargaTable)
    .leftJoin(wargaTable, eq(wargaTable.kkId, kartuKeluargaTable.id))
    .groupBy(kartuKeluargaTable.id)
    .orderBy(kartuKeluargaTable.nomorRumah);

  if (search) {
    rows = rows.filter(
      (r) =>
        r.namaKepalaKeluarga.toLowerCase().includes(search.toLowerCase()) ||
        r.nomorRumah.toLowerCase().includes(search.toLowerCase()) ||
        r.nomorKK.toLowerCase().includes(search.toLowerCase()),
    );
  }

  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/kk", async (req, res): Promise<void> => {
  const body = CreateKKBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [created] = await db.insert(kartuKeluargaTable).values(body.data).returning();
  res.status(201).json({ ...created, createdAt: created.createdAt.toISOString() });
});

router.get("/kk/:id", async (req, res): Promise<void> => {
  const params = GetKKParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select({
      id: kartuKeluargaTable.id,
      nomorKK: kartuKeluargaTable.nomorKK,
      nomorRumah: kartuKeluargaTable.nomorRumah,
      namaKepalaKeluarga: kartuKeluargaTable.namaKepalaKeluarga,
      createdAt: kartuKeluargaTable.createdAt,
      wargaCount: sql<number>`count(${wargaTable.id})`.mapWith(Number),
    })
    .from(kartuKeluargaTable)
    .leftJoin(wargaTable, eq(wargaTable.kkId, kartuKeluargaTable.id))
    .groupBy(kartuKeluargaTable.id)
    .where(eq(kartuKeluargaTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/kk/:id", async (req, res): Promise<void> => {
  const params = UpdateKKParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateKKBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [updated] = await db
    .update(kartuKeluargaTable)
    .set(body.data)
    .where(eq(kartuKeluargaTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/kk/:id", async (req, res): Promise<void> => {
  const params = DeleteKKParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(kartuKeluargaTable).where(eq(kartuKeluargaTable.id, params.data.id));
  res.json({ success: true });
});

export default router;
