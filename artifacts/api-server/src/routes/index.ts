import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workoutsRouter from "./workouts";
import settingsRouter from "./settings";
import biometricsRouter from "./biometrics";
import nutritionRouter from "./nutrition";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workoutsRouter);
router.use(settingsRouter);
router.use(biometricsRouter);
router.use(nutritionRouter);

export default router;
