import { Router } from "express";
import { db, pengumumanTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  CreatePengumumanBody,
  UpdatePengumumanParams,
  UpdatePengumumanBody,
  DeletePengumumanParams,
} from "@workspace/api-zod";


const router = Router();

function formatPengumuman(r: any) {
  return {
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
  };
}

router.get("/pengumuman", async (req, res): Promise<void> => {
  const rows = await db.select().from(pengumumanTable).orderBy(pengumumanTable.createdAt);
  res.json(rows.map(formatPengumuman).reverse());
});

router.post("/pengumuman", async (req, res): Promise<void> => {
  const body = CreatePengumumanBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { userId } = getAuth(req);
  const [created] = await db
    .insert(pengumumanTable)
    .values({ ...body.data, authorId: userId ?? null })
    .returning();
  res.status(201).json(formatPengumuman(created));
});

router.patch("/pengumuman/:id", async (req, res): Promise<void> => {
  const params = UpdatePengumumanParams.safeParse({ id: Number(req.params.id) });
  const body = UpdatePengumumanBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [updated] = await db
    .update(pengumumanTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(pengumumanTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatPengumuman(updated));
});

router.delete("/pengumuman/:id", async (req, res): Promise<void> => {
  const params = DeletePengumumanParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(pengumumanTable).where(eq(pengumumanTable.id, params.data.id));
  res.json({ success: true });
});

export default router;
