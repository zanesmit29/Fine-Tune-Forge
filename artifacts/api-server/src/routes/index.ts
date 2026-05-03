import { Router, type IRouter } from "express";
import healthRouter from "./health";
import modelsRouter from "./models";
import uploadRouter from "./upload";
import jobsRouter from "./jobs";
import libraryRouter from "./library";
import integrationsRouter from "./integrations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(modelsRouter);
router.use(uploadRouter);
router.use(jobsRouter);
router.use(libraryRouter);
router.use(integrationsRouter);

export default router;
