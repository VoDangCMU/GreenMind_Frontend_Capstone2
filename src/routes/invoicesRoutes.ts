import {Router} from "express";
import controller from "../controller";

const invoicesRouter = Router();

invoicesRouter.post('/create-invoice', controller.invoices.CreateInvoice);
invoicesRouter.get('/get-invoices', controller.invoices.GetInvoices);
invoicesRouter.get('/get-invoices-by-id/:id', controller.invoices.GetInvoiceById);
invoicesRouter.put('/update-invoice/:id', controller.invoices.UpdateInvoice);
invoicesRouter.delete('/delete-invoice/:id', controller.invoices.DeleteInvoice);


export default invoicesRouter;