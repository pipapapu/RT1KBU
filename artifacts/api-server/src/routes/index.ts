import { Router, type IRouter } from "express";
import healthRouter from "./health";
import kkRouter from "./kk";
import wargaRouter from "./warga";
import iuranRouter from "./iuran";
import suratRouter from "./surat";
import pengumumanRouter from "./pengumuman";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(kkRouter);
router.use(wargaRouter);
router.use(iuranRouter);
router.use(suratRouter);
router.use(pengumumanRouter);
router.use(dashboardRouter);

export default router;
