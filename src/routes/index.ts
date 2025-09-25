import { Router } from "express";
import caloriesRouter from "../routes/caloriesRoutes";
import invoicesRouter from "../routes/invoicesRoutes";
import questionRouter from "../routes/questionRoutes";
import checkRoutes from "./checkRoutes";
import userRoutes from "./userRoutes";
import tokenRouter from "./tokenRoutes";
import locationRouter from "./locationRoutes";
import templateRouter from "./templateRoutes";
import traitRouter from "./traitRoutes";
import foodItemsRouter from "../routes/fooditemsRoutes";
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
router.use(foodItemsRouter)
export default router;
