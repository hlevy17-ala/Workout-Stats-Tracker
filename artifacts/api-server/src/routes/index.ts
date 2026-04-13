import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workoutsRouter from "./workouts";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workoutsRouter);
router.use(settingsRouter);

export default router;
