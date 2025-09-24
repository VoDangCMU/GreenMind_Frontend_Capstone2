import NUMBER from "@root/config/schemas/Number";
import TEXT from "@root/config/schemas/Text";
import { Questions } from "@root/entity/questions";
import {AppDataSource} from "@root/infrastructure/database";
import {Request, RequestHandler, Response} from "express";
import {z} from "zod";

const questionsParamsSchemas = z.object({
    question: TEXT,
    trait: NUMBER,
    placeholders: TEXT,
    expected_answer: TEXT,

})

const questionsRepo = AppDataSource.getRepository(Questions);
export class QuestionsController {
    public CreateQuestion: RequestHandler = async (req: Request, res: Response) => {

        const parsed = questionsParamsSchemas.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({message: "Invalid input"});
        }

        const newQuestion = questionsRepo.create({...parsed.data});
        await questionsRepo.save(newQuestion)
        .then(question => {
                return res.status(200).json({message: "Question created successfully", data: question});
            })
            .catch(error => {
                return res.status(500).json({message: "Internal Server Error"});
            })
    }

    public GetQuestions: RequestHandler = async (req: Request, res: Response) => {
        try {
            const questions = await questionsRepo.find();
            return res.status(200).json({questions: questions});
        } catch (error) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }

    public GetQuestionById: RequestHandler = async (req: Request, res: Response) => {
        const questionId = req.params.id;
        if (!questionId) {
            return res.status(400).json({message: "Invalid question ID"});
        }
        try {
            const question = questionsRepo.findOne({
                where: {
                    id: questionId
                }
            })
            return res.status(200).json({message: "Question found", data: question});
        } catch (e) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }

    public UpdateQuestion: RequestHandler = async (req: Request, res: Response) => {
        const newData = z.object({
            question: TEXT.optional(),
            trait: NUMBER.optional(),
            placeholders: TEXT.optional(),
            expected_answer: TEXT.optional()
        })
        const questionId = req.params.id;
        if (!questionId) {
            return res.status(400).json({message: "Invalid question ID"});
        }
        const parsed = newData.safeParse(req.body);
        try {
            const question = await questionsRepo.findOne({
                where: {
                    id: questionId
                }
            })
            if (!question) {
                return res.status(404).json({message: "Question not found"});
            }
            Object.assign(question, parsed.data);
            const updated = await questionsRepo.save(question);
            return res.status(200).json({message: "Question updated successfully", data: updated});
        } catch (e) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }
    
    public DeleteQuestion: RequestHandler = async (req: Request, res: Response) => {
        const questionId = req.params.id;
        if (!questionId) {
            return res.status(400).json({message: "Invalid question ID"});
        }
        try {
            const question = await questionsRepo.findOne({
                where: {
                    id: questionId
                }
            })
            if (!question) {
                return res.status(404).json({message: "Question not found"});
            }
            
        } catch (e) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }

}


export default new QuestionsController();
