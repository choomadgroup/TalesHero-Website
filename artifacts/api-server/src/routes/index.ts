import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import leaderboardRouter from "./leaderboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(leaderboardRouter);

export default router;
