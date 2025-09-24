import { Router } from "express";
import checkRoutes from "@root/routes/checkRoutes";
import userRoutes from "@root/routes/userRoutes";
import tokenRouter from "@root/routes/tokenRoutes";
import locationRouter from "@root/routes/locationRoutes";
import {jwtAuthMiddleware} from "@root/middlewares/jwtMiddleware";
import caloriesRouter from "@root/routes/caloriesRoutes";
import invoicesRouter from "@root/routes/invoicesRoutes";
import questionRouter from "@root/routes/questionRoutes";
import checkRoutes from "./checkRoutes";
import userRoutes from "./userRoutes";
import tokenRouter from "./tokenRoutes";
import locationRouter from "./locationRoutes";
import templateRouter from "./templateRoutes";
import traitRouter from "./traitRoutes";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";
const router = Router();

router.use(checkRoutes);
router.use(userRoutes);
router.use(tokenRouter);
router.use(locationRouter);
router.use(caloriesRouter);
router.use(invoicesRouter)
router.use(questionRouter);
router.use(templateRouter);
router.use(traitRouter)

export default router;
