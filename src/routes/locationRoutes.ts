import {Router} from "express";
import locationController from "../controller/locationController";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";

const location = Router();

location.use(jwtAuthMiddleware)
location.post("/location/create", locationController.createLocation);
location.get("/location/:id", locationController.getLocationById);
location.put("/location/update/:id", locationController.updateLocationById);
location.delete("/location/delete/:id", locationController.deleteLocationById);

export default location;
