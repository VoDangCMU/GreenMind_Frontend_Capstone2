import {z} from "zod";
import TEXT from "../config/schemas/Text";
import AppDataSource from "../infrastructure/database";
import {FoodItems} from "../entity/food_items";
import {Request, Response, RequestHandler} from "express";

const foodItemsParamsSchemas = z.object({
    name: TEXT,
    barcode: TEXT,
})

const foodItemsRepo = AppDataSource.getRepository(FoodItems);

export class FoodItemsController {
    public CreateFoodItem: RequestHandler = async (req: Request, res: Response) => {
        const parsed = foodItemsParamsSchemas.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({message: "Invalid input", error: parsed.error.format()});
        }

        const newFoodItem = foodItemsRepo.create({...parsed.data});

        await foodItemsRepo.save(newFoodItem)
        .then(foodItem => {
                return res.status(200).json({message: "Food item created successfully", data: foodItem});
            })
            .catch(error => {
                return res.status(500).json({message: "Internal Server Error"});
            })
    }

    public GetFoodItems: RequestHandler = async (req: Request, res: Response) => {
        try {
            const foodItems = await foodItemsRepo.find();
            return res.status(200).json({foodItems: foodItems.length > 0 ? foodItems : "No food items yet"});
        } catch (error) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }
    public GetFoodItemsById: RequestHandler = async (req: Request, res: Response) => {
        const foodItemId = req.params.id;
        if (!foodItemId) {
            return res.status(400).json({message: "Invalid food item ID"});
        }
        try {
            const foodItem = await foodItemsRepo.findOne({
                where: {
                    id: foodItemId
                }
            })
            if (!foodItem) {
                return res.status(404).json({message: "Food item not found"});
            }
            return res.status(200).json({message: "Food item found", data: foodItem});
        } catch (e) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }
    public UpdateFoodItem: RequestHandler = async (req: Request, res: Response) => {
        const newData = z.object({
            name: TEXT.optional(),
            barcode: TEXT.optional()
        })
        const foodItemId = req.params.id;
        if (!foodItemId) {
            return res.status(400).json({message: "Invalid food item ID"});
        }
        const parsed = newData.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({message: "Invalid input", error: parsed.error.format()});
        }
        try {
            const foodItem = await foodItemsRepo.findOne({
                where: {
                    id: foodItemId
                }
            })
            if (!foodItem) {
                return res.status(404).json({message: "Food item not found"});
            }
            Object.assign(foodItem, parsed.data);
            const updated = await foodItemsRepo.save(foodItem);
            return res.status(200).json({message: "Food item updated successfully", data: updated});
        } catch (e) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }
    public DeleteFoodItem: RequestHandler = async (req: Request, res: Response) => {

        const foodItemId = req.params.id;
        if (!foodItemId) {
            return res.status(400).json({message: "Invalid food items ID"});
        }
        try {
            const foodItem = await foodItemsRepo.findOne({
                where: {
                    id: foodItemId
                }
            })
            if (!foodItem) {
                return res.status(404).json({message: "Food items not found"});
            }
            await foodItemsRepo.delete(foodItemId);
            res.status(200).json({message: "Food items deleted successfully", deleted: foodItem});
            return;
        } catch (e) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }
}

export default new FoodItemsController();