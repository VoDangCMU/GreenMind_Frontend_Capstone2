import {Router} from "express";
import controller from "../controller";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";

const modelRouter = Router();

modelRouter.post('/create', jwtAuthMiddleware, controller.model.createModel);
modelRouter.get('/getAll', jwtAuthMiddleware, controller.model.getAllModels);

export default modelRouter;
