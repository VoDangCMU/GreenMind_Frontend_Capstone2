import { Request, Response } from "express";
import { z } from "zod";
import AppDataSource from "../infrastructure/database";
import { Template } from "../entity/templates";
import { TemplateAnswer } from "../entity/template_answers";
import { logger } from "../infrastructure/logger";

const TemplateAnswerSchema = z.object({
    type: z.string(),
    scale: z.array(z.number()).optional(),
    labels: z.array(z.string()).optional(),
    options: z.array(z.string()).optional(),
});

const TemplateSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    intent: z.string(),
    prompt: z.string(),
    used_placeholders: z.array(z.string()).optional(),
    question_type: z.string().optional(),
    filled_prompt: z.string().optional(),
    answer: TemplateAnswerSchema,
});

const TemplateIdSchema = z.object({
    id: z.string(),
});

const TemplateRepository = AppDataSource.getRepository(Template);
const TemplateAnswerRepository = AppDataSource.getRepository(TemplateAnswer);

function validateTemplateParams(req: Request, res: Response) {
    const parsed = TemplateSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error("Zod validation error", undefined, { details: parsed.error });
        res.status(400).json({
            message: "Validation error",
            errors: parsed.error.format(),
        });
        return null;
    }
    return parsed.data;
}

function validateTemplateIdParams(req: Request, res: Response) {
    const parsed = TemplateIdSchema.safeParse(req.params);
    if (!parsed.success) {
        logger.error("Zod validation error", undefined, { details: parsed.error });
        res.status(400).json({
            message: "Validation error",
            errors: parsed.error.format(),
        });
        return null;
    }
    return parsed.data;
}

class TemplateController {
    public async createTemplate(req: Request, res: Response) {
        const data = validateTemplateParams(req, res);
        if (!data) return;

        try {
            const existedTemplate = await TemplateRepository.findOne({
                where: {
                    id: data.id
                },
            });

            if (existedTemplate) {
                return res.status(400).json({ message: "Template with this ID already exists" });
            }

            const newTemplateAnswer = TemplateAnswerRepository.create({
                type: data.answer.type,
                scale: data.answer.scale,
                labels: data.answer.labels,
                options: data.answer.options,
            });

            const newTemplate = TemplateRepository.create({
                id: data.id,
                name: data.name,
                description: data.description,
                intent: data.intent,
                prompt: data.prompt,
                used_placeholders: data.used_placeholders,
                question_type: data.question_type,
                filled_prompt: data.filled_prompt,
                answer: newTemplateAnswer,
            });

            const createdTemplate = await TemplateRepository.save(newTemplate);

            return res.status(200).json({ createdTemplate });
        } catch (e) {
            logger.error("Error creating template", e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    public async getAllTemplates(req: Request, res: Response) {
        try {
            const templates = await TemplateRepository.find({});

            return res.status(200).json({ templates });
        } catch (e) {
            logger.error("Error fetching templates", e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    public async getTemplateById(req: Request, res: Response) {
        const idData = validateTemplateIdParams(req, res);
        if (!idData) return;

        try {
            const existedTemplate = await TemplateRepository.findOne({
                where: {
                    id: idData.id
                },
            });

            if (!existedTemplate) {
                return res.status(404).json({ message: "Template not found" });
            }

            return res.status(200).json({ existedTemplate });
        } catch (e) {
            logger.error("Error fetching template by ID", e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    public async updateTemplateById(req: Request, res: Response) {
        const data = validateTemplateParams(req, res);
        if (!data) return;

        try {
            const existedTemplate = await TemplateRepository.findOne({
                where: {
                    id: data.id

                },
                relations: ["answer"],
            });

            if (!existedTemplate) {
                return res.status(404).json({ message: "Template not found" });
            }

            existedTemplate.name = data.name ?? existedTemplate.name;
            existedTemplate.intent = data.intent ?? existedTemplate.intent;
            existedTemplate.prompt = data.prompt ?? existedTemplate.prompt;
            existedTemplate.used_placeholders = data.used_placeholders ?? existedTemplate.used_placeholders;
            existedTemplate.question_type = data.question_type ?? existedTemplate.question_type;
            existedTemplate.filled_prompt = data.filled_prompt ?? existedTemplate.filled_prompt;
            existedTemplate.description = data.description ?? existedTemplate.description;

            if (existedTemplate.answer) {
                existedTemplate.answer.type = data.answer.type ?? existedTemplate.answer.type;
                existedTemplate.answer.scale = data.answer.scale ?? existedTemplate.answer.scale;
                existedTemplate.answer.labels = data.answer.labels ?? existedTemplate.answer.labels;
                existedTemplate.answer.options = data.answer.options ?? existedTemplate.answer.options;
            } else {
                const newAnswer = new TemplateAnswer();
                newAnswer.type = data.answer.type;
                newAnswer.scale = data.answer.scale;
                newAnswer.labels = data.answer.labels;
                newAnswer.options = data.answer.options;
                existedTemplate.answer = newAnswer;
            }

            const updatedTemplate = await TemplateRepository.save(existedTemplate);

            return res.status(200).json({ updatedTemplate });
        } catch (e) {
            logger.error("Error updating template", e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    public async deleteTemplateById(req: Request, res: Response) {
        const idData = validateTemplateIdParams(req, res);
        if (!idData) return;

        try {
            const existedTemplate = await TemplateRepository.findOne({
                where: {
                    id: idData.id
                },
            });

            if (!existedTemplate) {
                return res.status(404).json({ message: "Template not found" });
            }

            await TemplateRepository.remove(existedTemplate);

            return res.status(200).json({existedTemplate });
        } catch (e) {
            logger.error("Error deleting template", e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}

export default new TemplateController();
