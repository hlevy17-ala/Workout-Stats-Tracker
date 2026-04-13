import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workoutsRouter from "./workouts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workoutsRouter);

export default router;
