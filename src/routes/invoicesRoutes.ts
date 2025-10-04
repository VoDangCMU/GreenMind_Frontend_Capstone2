import {Router} from "express";
import controller from "../controller";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";

const invoicesRouter = Router();

invoicesRouter.post('/create-invoice',jwtAuthMiddleware, controller.invoices.CreateInvoice);
invoicesRouter.get('/get-invoices', jwtAuthMiddleware, controller.invoices.GetInvoices);
invoicesRouter.get('/get-invoices-by-id/:id',jwtAuthMiddleware, controller.invoices.GetInvoiceById);
invoicesRouter.put('/update-invoice/:id', jwtAuthMiddleware,controller.invoices.UpdateInvoice);
invoicesRouter.delete('/delete-invoice/:id', jwtAuthMiddleware, controller.invoices.DeleteInvoice);


export default invoicesRouter;