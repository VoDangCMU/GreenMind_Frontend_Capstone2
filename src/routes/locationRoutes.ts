import { Router } from "express";
import locationController from "@root/controller/locationController";
import controller from "@root/controller";

const locationRouter = Router();


locationRouter.post("/location/create", locationController.create);

export default locationRouter;