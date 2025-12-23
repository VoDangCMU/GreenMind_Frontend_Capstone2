import {Router} from "express";
import controller from "../controller";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";


const router = Router();

router.post('/create-checkin', jwtAuthMiddleware, controller.checkin.CreateCheckin);

router.get('/get-checkins', jwtAuthMiddleware, controller.checkin.GetCheckins);
router.put('/update-checkin/:id', jwtAuthMiddleware, controller.checkin.UpdateCheckin);
router.delete('/delete-checkin/:id', jwtAuthMiddleware, controller.checkin.DeleteCheckin);
router.get('/get-checkins-by-period', jwtAuthMiddleware, controller.checkin.GetCheckinsByPeriod);
router.get('/get-checkins-by-params', jwtAuthMiddleware, controller.checkin.GetCheckinsByParams);
export default router;