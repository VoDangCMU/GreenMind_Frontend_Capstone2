import { Request, Response } from "express";
import { z } from "zod";
import AppDataSource from "../infrastructure/database";
import { Models } from "../entity/models";
import { Template } from "../entity/templates";
import { TemplateAnswer } from "../entity/template_answers";
import { Questions } from "../entity/questions";
import { QuestionOptions } from "../entity/question_options";
import { logger } from "../infrastructure/logger";

// Model schemas
const CreateModelSchema = z.object({
    ocean: z.string(),
    behavior: z.string(),
    age: z.string(),
    location: z.string(),
    gender: z.string(),
    keywords: z.string(),
});

// Model Controller Functions
const createModel = async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedData = CreateModelSchema.parse(req.body);

        const modelRepository = AppDataSource.getRepository(Models);

        const newModel = modelRepository.create({
            ocean: validatedData.ocean,
            behavior: validatedData.behavior,
            age: validatedData.age,
            location: validatedData.location,
            gender: validatedData.gender,
            keywords: validatedData.keywords,
        });

        const savedModel = await modelRepository.save(newModel);

        logger.info(`Model created successfully with ID: ${savedModel.id}`);
        res.status(201).json({
            success: true,
            message: "Model created successfully",
            data: savedModel,
        });
    } catch (error) {
        // logger.error("Error creating model:");
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: error.errors,
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
};

const getAllModels = async (req: Request, res: Response): Promise<void> => {
    try {
        const modelRepository = AppDataSource.getRepository(Models);
        const models = await modelRepository.find({
            order: { createdAt: "DESC" }
        });

        res.status(200).json({
            success: true,
            message: "Models retrieved successfully",
            data: models,
        });
    } catch (error) {
        logger.error("Error retrieving models:");
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const modelController = {
    createModel,
    getAllModels
};
