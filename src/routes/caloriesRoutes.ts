import {Router} from "express";
import controller from "@root/controller";


const caloriesRouter = Router();

caloriesRouter.post('/calories/create-calories', controller.calories.CreateCalories);
caloriesRouter.get('/calories/get-calories', controller.calories.GetCalories);
caloriesRouter.get('/calories/get-calories-by-id:id', controller.calories.GetCaloriesById);
caloriesRouter.put('/calories/update-calories:id', controller.calories.UpdateCalories);
caloriesRouter.delete('/calories/delete-calories:id', controller.calories.DeleteCalories);

export default caloriesRouter;