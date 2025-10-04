import {Router} from "express";
import controller from "../controller";

const foodItemsRouter = Router();

foodItemsRouter.get('/get-food-items', controller.foodItems.GetFoodItems);
foodItemsRouter.get('/get-food-items-by-id/:id', controller.foodItems.GetFoodItemsById);
foodItemsRouter.post('/create-food-items', controller.foodItems.CreateFoodItem);
foodItemsRouter.put('/update-food-items/:id', controller.foodItems.UpdateFoodItem);
foodItemsRouter.delete('/delete-food-items/:id', controller.foodItems.DeleteFoodItem);
export default foodItemsRouter;