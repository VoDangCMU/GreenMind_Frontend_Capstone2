import { Router } from "express";
import controller from "../controller";
import { jwtAuthMiddleware } from "../middlewares/jwtMiddleware";

const router = Router();


router.patch("/night-out", jwtAuthMiddleware, controller.nightOutFreq.patchNightOut);

export default router;