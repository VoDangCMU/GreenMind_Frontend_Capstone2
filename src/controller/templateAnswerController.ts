import {Request, Response} from 'express';
import {z} from 'zod';
import AppDataSource from '../infrastructure/database';
import {TemplateAnswer} from '../entity/template_answers';
import {logger} from '../infrastructure/logger';

const TemplateAnswerSchema = z.object({
    id: z.string(),
    type: z.string(),
    scale: z.array(z.number()).optional(),
    labels: z.array(z.string()).optional(),
    options: z.array(z.string()).optional(),
});

const TemplateAnswerUpdateSchema = z.object({
    type: z.string(),
    scale: z.array(z.number()).optional(),
    labels: z.array(z.string()).optional(),
    options: z.array(z.string()).optional(),
});

const TemplateAnswerIdSchema = z.object({
    id: z.string(),
});

const TemplateAnswerRepository = AppDataSource.getRepository(TemplateAnswer);

function validateTemplateAnswerParams(req: Request, res: Response) {
    const parsed = TemplateAnswerSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, {
            details: parsed.error,
        });
        res.status(400).json({
            message: "Validation error",
            errors: parsed.error.format()
        });
        return null;
    }
    return parsed.data;
}

function validateTemplateAnswerUpdateParams(req: Request, res: Response) {
    const parsed = TemplateAnswerUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, {
            details: parsed.error,
        });
        res.status(400).json({
            message: "Validation error",
            errors: parsed.error.format()
        });
        return null;
    }
    return parsed.data;
}

function validateTemplateAnswerIdParams(req: Request, res: Response) {
    const parsed = TemplateAnswerIdSchema.safeParse(req.params);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, {
            details: parsed.error,
        });
        res.status(400).json({
            message: "Validation error",
            errors: parsed.error.format()
        });
        return null;
    }
    return parsed.data;
}

class TemplateAnswerController {
    public async createTemplateAnswer(req: Request, res: Response) {
        const data = validateTemplateAnswerParams(req, res);
        if (!data) return;

        try {
            const newTemplateAnswer = new TemplateAnswer();

            newTemplateAnswer.id = data.id;
            newTemplateAnswer.type = data.type;
            newTemplateAnswer.scale = data.scale;
            newTemplateAnswer.labels = data.labels;
            newTemplateAnswer.options = data.options;

            const createdTemplateAnswer = await TemplateAnswerRepository.save(newTemplateAnswer);

            return res.status(200).json({createdTemplateAnswer});
        } catch (e) {
            logger.error('Error creating template answer', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    public async getAllTemplateAnswers(req: Request, res: Response) {
        try {
            const templateAnswers = await TemplateAnswerRepository.find({});
            return res.status(200).json({templateAnswers});
        } catch (e) {
            logger.error('Error fetching template answers', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    public async getTemplateAnswerById(req: Request, res: Response) {
        const data = validateTemplateAnswerIdParams(req, res);
        if (!data) return;

        try {
            const templateAnswer = await TemplateAnswerRepository.findOne({
                where: {
                    id: data.id
                }
            })

            if (!templateAnswer) {
                return res.status(404).json({message: 'Template Answer not found'});
            }

            return res.status(200).json({templateAnswer});
        } catch (e) {
            logger.error('Error fetching template answer', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    public async updateTemplateAnswerById(req: Request, res: Response) {
        const data = validateTemplateAnswerParams(req, res);
        if (!data) return;


        try {
            const existedTemplateAnswer = await TemplateAnswerRepository.findOne({
                where: {
                    id: data.id
                }
            });

            if (!existedTemplateAnswer) {
                return res.status(404).json({message:'Template Answer not found'});
            }

            existedTemplateAnswer.type = data.type;
            existedTemplateAnswer.scale = data.scale;
            existedTemplateAnswer.labels = data.labels;
            existedTemplateAnswer.options = data.options;

            const updatedTemplateAnswer = await TemplateAnswerRepository.save(existedTemplateAnswer);

            return res.status(200).json({updatedTemplateAnswer});
        } catch (e) {
            logger.error('Error updating template answer', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    public async deleteTemplateAnswerById(req: Request, res: Response) {
        const data = validateTemplateAnswerIdParams(req, res);
        if (!data) return;

        try {
            const existedTemplateAnswer = await TemplateAnswerRepository.findOne({
                where: {
                    id: data.id
                }
            });

            if (!existedTemplateAnswer) {
                return res.status(404).json({message:'Template Answer not found'});
            }

            await TemplateAnswerRepository.delete(data.id);

            return res.status(200).json({existedTemplateAnswer});
        } catch (e) {
            logger.error('Error fetching template answer', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}

export default new TemplateAnswerController();