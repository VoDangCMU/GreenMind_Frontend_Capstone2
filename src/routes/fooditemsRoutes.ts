import {Router} from "express";
import controller from "../controller";

const foodItemsRouter = Router();

foodItemsRouter.get('/food-items/get-food-items', controller.foodItems.GetFoodItems);
foodItemsRouter.get('/food-items/get-food-items-by-id/:id', controller.foodItems.GetFoodItemsById);
foodItemsRouter.post('/food-items/create-food-items', controller.foodItems.CreateFoodItem);
foodItemsRouter.put('/food-items/update-food-items/:id', controller.foodItems.UpdateFoodItem);
foodItemsRouter.delete('/food-items/delete-food-items/:id', controller.foodItems.DeleteFoodItem);
export default foodItemsRouter;