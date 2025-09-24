import {Request, RequestHandler, Response} from "express";
import {z} from "zod";
import DATE_TIME from "../config/schemas/Datetime";
import {Invoices} from "../entity/invoices";
import AppDataSource from "../infrastructure/database";

const invoiceParamsSchemas = z.object({
    issued_at: z.string().time(),
})

const InvoicesRepo = AppDataSource.getRepository(Invoices);

export class InvoicesController {
    public CreateInvoice: RequestHandler = async (req: Request, res: Response) => {
        const parsed = invoiceParamsSchemas.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({message: "Invalid input", error: parsed.error.format()});
        }

        const newInvoice = InvoicesRepo.create({...parsed.data});
        await InvoicesRepo.save(newInvoice)
        .then(invoice => {
                return res.status(200).json({message: "Invoice created successfully", data: invoice});
            })
            .catch(error => {
                return res.status(500).json({message: "Internal Server Error"});
            })
    }

    public GetInvoices: RequestHandler = async (req: Request, res: Response) => {
        try {
            const invoices = await InvoicesRepo.find();
            return res.status(200).json({data: invoices.length > 0 ? invoices : "No invoices yet"});
        } catch (error) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }

    public GetInvoiceById: RequestHandler = async (req: Request, res: Response) => {
        const invoiceId = req.params.id;
        if (!invoiceId) {
            return res.status(400).json({message: "Invalid invoice ID"});
        }
        try {
            const invoice = await InvoicesRepo.findOne({
                where: {
                    id: invoiceId
                }
            })
            res.status(200).json({message: "Invoice found", data: invoice});
            return;

        } catch (e) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }

    public UpdateInvoice: RequestHandler = async (req: Request, res: Response) => {
        const newData = z.object({
            issued_at: z.string().time().optional()
        })
        const invoiceId = req.params.id;
        if (!invoiceId) {
            return res.status(400).json({message: "Invalid invoice ID"});
        }
        const parsed = newData.safeParse(req.body);
        try {
            const invoice = await InvoicesRepo.findOne({
                where: {
                    id: invoiceId
                }
            })
            if (!invoice) {
                return res.status(404).json({message: "Invoice not found"});
            }
            Object.assign(invoice, parsed.data);
            const updated = await InvoicesRepo.save(invoice);
            return res.status(200).json({message: "Invoice updated successfully", data: updated});
        } catch (e) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }

    public DeleteInvoice: RequestHandler = async (req: Request, res: Response) => {
        const invoiceId = req.params.id;
        if (!invoiceId) {
            return res.status(400).json({message: "Invalid invoice ID"});
        }
        try {
            const invoice = await InvoicesRepo.findOne({
                where: {
                    id: invoiceId
                }
            })
            if (!invoice) {
                return res.status(404).json({message: "Invoice not found"});
            }
            await InvoicesRepo.delete(invoiceId);
            return res.status(200).json({message: "Invoice deleted successfully", deleted: invoice});
        } catch (e) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }
}

export default new InvoicesController();