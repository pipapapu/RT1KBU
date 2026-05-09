import { Router } from "express";
import { db, suratTable, wargaTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  ListSuratQueryParams,
  CreateSuratBody,
  GetSuratParams,
  UpdateSuratStatusParams,
  UpdateSuratStatusBody,
} from "@workspace/api-zod";


const router = Router();

function formatSurat(r: any) {
  return {
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
  };
}

router.get("/surat", async (req, res): Promise<void> => {
  const query = ListSuratQueryParams.safeParse({ status: req.query.status });
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  let rows = await db.select().from(suratTable).orderBy(suratTable.createdAt);
  if (query.data.status) {
    rows = rows.filter((r) => r.status === query.data.status);
  }
  res.json(rows.map(formatSurat));
});

router.post("/surat", async (req, res): Promise<void> => {
  const body = CreateSuratBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { userId } = getAuth(req);

  // Try to get warga info for the user
  let nomorRumah = body.data.nomorRumah ?? null;
  if (userId && !nomorRumah) {
    const [warga] = await db.select().from(wargaTable).where(eq(wargaTable.clerkUserId, userId));
    if (warga) nomorRumah = warga.nomorRumah;
  }

  const [created] = await db
    .insert(suratTable)
    .values({
      clerkUserId: userId ?? null,
      namaLengkap: body.data.namaLengkap,
      nomorRumah,
      jenisSurat: body.data.jenisSurat,
      alasan: body.data.alasan,
    })
    .returning();
  res.status(201).json(formatSurat(created));
});

router.get("/surat/my", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const rows = await db
    .select()
    .from(suratTable)
    .where(eq(suratTable.clerkUserId, userId))
    .orderBy(suratTable.createdAt);
  res.json(rows.map(formatSurat));
});

router.get("/surat/:id", async (req, res): Promise<void> => {
  const params = GetSuratParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db.select().from(suratTable).where(eq(suratTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatSurat(row));
});

router.patch("/surat/:id", async (req, res): Promise<void> => {
  const params = UpdateSuratStatusParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateSuratStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [updated] = await db
    .update(suratTable)
    .set({ status: body.data.status, catatanAdmin: body.data.catatanAdmin, updatedAt: new Date() })
    .where(eq(suratTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatSurat(updated));
});

export default router;
