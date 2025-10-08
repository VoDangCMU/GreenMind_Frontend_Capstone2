import {Router} from "express";
import controller from "../controller";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";

const templateAnswerRouter = Router();

templateAnswerRouter.post('/create',jwtAuthMiddleware, controller.templateAnswer.createTemplateAnswer);
templateAnswerRouter.get('/getById/:id', jwtAuthMiddleware, controller.templateAnswer.getTemplateAnswerById);
templateAnswerRouter.get('/getAll',jwtAuthMiddleware, controller.templateAnswer.getAllTemplateAnswers);
templateAnswerRouter.put('/update', jwtAuthMiddleware,controller.templateAnswer.updateTemplateAnswerById);
templateAnswerRouter.delete('/delete/:id', jwtAuthMiddleware, controller.templateAnswer.deleteTemplateAnswerById);


export default templateAnswerRouter;