import {Router} from "express";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";
import controller from "../controller";


const router = Router();

router.post("/spend", jwtAuthMiddleware, controller.dailyPending.CreateOrUpdateSpend);

export default router;