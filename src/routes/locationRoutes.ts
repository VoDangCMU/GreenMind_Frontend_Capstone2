import { Router } from "express";
import locationController from "../controller/locationController";
import { jwtAuthMiddleware } from "../middlewares/jwtMiddleware";

const router = Router();

router.use(jwtAuthMiddleware);
router.post("/create", locationController.createLocation);
router.get("/get-locations",locationController.GetLocations)

export default router;
