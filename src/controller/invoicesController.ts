import { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import AppDataSource from "../infrastructure/database";
import { Invoices } from "../entity/invoices";
import { InvoiceItems } from "../entity/invoice_items";
import { Vendor } from "../entity/vendor";
import TEXT from "../config/schemas/Text";
import NUMBER from "../config/schemas/Number";
import BOOLEAN from "../config/schemas/Boolean";

const invoiceItemsParamsSchemas = z.object({
    raw_name: TEXT.nullish(),
    brand: TEXT.nullish(),
    category: TEXT.nullish(),
    plant_based: BOOLEAN.default(false).nullish(),
    quantity: NUMBER,
    unit_price: NUMBER,
    line_total: NUMBER,
    matched_shopping_list: BOOLEAN.default(false).nullish(),
});

const vendorParamsSchemas = z.object({
    name: TEXT,
    address: TEXT,
    geo_hint: TEXT.nullish(),
});

const docSchema = z.object({
    source_id: z.string().uuid().nullish().optional(),
    currency: TEXT,
    payment_method: TEXT,
    notes: TEXT.nullish(),
});

const datetimeSchema = z.object({
    date: TEXT, // "02/06/2018"
    time: TEXT.nullish(),
});

const totalsSchema = z.object({
    subtotal: NUMBER,
    discount: NUMBER,
    tax: NUMBER,
    grand_total: NUMBER,
});

const invoiceSchema = z.object({
    doc: docSchema,
    vendor: vendorParamsSchemas,
    datetime: datetimeSchema,
    items: z.array(invoiceItemsParamsSchemas),
    totals: totalsSchema,
});

const InvoicesRepo = AppDataSource.getRepository(Invoices);
const InvoiceItemsRepo = AppDataSource.getRepository(InvoiceItems);
const VendorRepo = AppDataSource.getRepository(Vendor);

export class InvoicesController {
    public CreateInvoice: RequestHandler = async (req: Request, res: Response) => {
        const parsed = invoiceSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid input",
                error: parsed.error.format(),
            });
        }

        try {
            const { doc, vendor, datetime, items, totals } = parsed.data;

            let newVendor: Vendor | null = null;
            if (vendor?.name && vendor?.address) {
                const checkVendor = await VendorRepo.findOne({
                    where: {
                        name: vendor.name,
                        address: vendor.address,
                    },
                });

                if (checkVendor) {
                    newVendor = checkVendor;
                } else {
                    newVendor = VendorRepo.create({
                        name: vendor.name,
                        address: vendor.address,
                        geo_hint: vendor.geo_hint ?? null,
                    });
                    await VendorRepo.save(newVendor);
                }
            }
            let issuedDate: Date | undefined;
            if (datetime?.date) {
                const [day, month, year] = datetime.date.split("/");
                issuedDate = new Date(Date.UTC(+year, +month - 1, +day));
            }

            const newInvoice = InvoicesRepo.create({
                currency: doc?.currency ?? "VND",
                payment_method: doc?.payment_method ?? "unknown",
                notes: doc?.notes ?? null,
                subtotal: totals?.subtotal ?? 0,
                discount: totals?.discount ?? 0,
                tax: totals?.tax ?? 0,
                grand_total: totals?.grand_total ?? 0,
                issued_date: issuedDate,
                vendor: newVendor ?? undefined,
            });
            await InvoicesRepo.save(newInvoice);

            if (items && items.length > 0) {
                for (const it of items) {
                    const invoiceItem = InvoiceItemsRepo.create({
                        raw_name: it.raw_name ?? "",
                        brand: it.brand ?? null,
                        category: it.category ?? null,
                        plant_based: it.plant_based ?? false,
                        quantity: it.quantity ?? 0,
                        unit_price: it.unit_price ?? 0,
                        line_total: it.line_total ?? 0,
                        matched_shopping_list: it.matched_shopping_list ?? false,
                        invoice: newInvoice,
                    });
                    await InvoiceItemsRepo.save(invoiceItem);
                }
            }

            const fullInvoice = await InvoicesRepo.findOne({
                where: { id: newInvoice.id },
                relations: { items: true, vendor: true },
            });

            return res.status(201).json({
                message: "Invoice created successfully",
                data: fullInvoice,
            });
        } catch (error) {
            console.error("CreateInvoice Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };

    public GetInvoices: RequestHandler = async (req: Request, res: Response) => {
        try {
            const invoices = await InvoicesRepo.find({
                relations: {
                    items: true,
                    vendor: true,
                },
                order: { createdAt: "DESC" },
            });

            return res.status(200).json({message: "Successfully", data: invoices.length > 0 ? invoices : "No invoices yet"});
        } catch (error) {
            console.error("GetInvoices Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };
    public GetInvoiceById: RequestHandler = async (req: Request, res: Response) => {
        const invoiceId = req.params.id;
        if (!invoiceId) {
            return res.status(400).json({ message: "Invalid invoice ID" });
        }
        try {
            const invoice = await InvoicesRepo.findOne({
                where: {
                    id: invoiceId,
                },
                relations: {
                    items: true,
                    vendor: true,
                },
            })
            if (!invoice) {
                return res.status(404).json({ message: "Invoice not found" });
            }
            res.status(200).json({message: `Invoice with id = ${invoiceId} found`, data: invoice});
        } catch (e) {
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    public UpdateInvoice: RequestHandler = async (req: Request, res: Response) => {
        const invoiceId = req.params.id;
        if (!invoiceId) {
            return res.status(400).json({ message: "Missing invoice ID" });
        }

        const parsed = invoiceSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid input",
                error: parsed.error.format(),
            });
        }

        try {
            const { doc, vendor, datetime, items, totals } = parsed.data;

            // --- Tìm invoice ---
            const existingInvoice = await InvoicesRepo.findOne({
                where: { id: invoiceId },
                relations: { items: true, vendor: true },
            });
            if (!existingInvoice) {
                return res.status(404).json({ message: "Invoice not found" });
            }

            let updatedVendor: Vendor | null = null;
            if (vendor?.name && vendor?.address) {
                const checkVendor = await VendorRepo.findOne({
                    where: { name: vendor.name, address: vendor.address },
                });

                if (checkVendor) {
                    updatedVendor = checkVendor;
                } else {
                    updatedVendor = VendorRepo.create({
                        name: vendor.name,
                        address: vendor.address,
                        geo_hint: vendor.geo_hint ?? null,
                    });
                    await VendorRepo.save(updatedVendor);
                }
            }

            let issuedDate: Date | undefined;
            if (datetime?.date) {
                const [day, month, year] = datetime.date.split("/");
                issuedDate = new Date(Date.UTC(+year, +month - 1, +day));
            }
            existingInvoice.currency = doc?.currency ?? existingInvoice.currency;
            existingInvoice.payment_method = doc?.payment_method ?? existingInvoice.payment_method;
            existingInvoice.notes = doc?.notes ?? existingInvoice.notes;
            existingInvoice.subtotal = totals?.subtotal ?? existingInvoice.subtotal;
            existingInvoice.discount = totals?.discount ?? existingInvoice.discount;
            existingInvoice.tax = totals?.tax ?? existingInvoice.tax;
            existingInvoice.grand_total = totals?.grand_total ?? existingInvoice.grand_total;
            existingInvoice.issued_date = issuedDate ?? existingInvoice.issued_date;
            existingInvoice.vendor = updatedVendor ?? existingInvoice.vendor;
            await InvoicesRepo.save(existingInvoice);

            if (items && items.length > 0) {
                await InvoiceItemsRepo.delete({ invoice: { id: existingInvoice.id } });

                for (const it of items) {
                    const invoiceItem = InvoiceItemsRepo.create({
                        raw_name: it.raw_name ?? "",
                        brand: it.brand ?? null,
                        category: it.category ?? null,
                        plant_based: it.plant_based ?? false,
                        quantity: it.quantity ?? 0,
                        unit_price: it.unit_price ?? 0,
                        line_total: it.line_total ?? 0,
                        matched_shopping_list: it.matched_shopping_list ?? false,
                        invoice: existingInvoice,
                    });
                    await InvoiceItemsRepo.save(invoiceItem);
                }
            }

            const updatedInvoice = await InvoicesRepo.findOne({
                where: { id: existingInvoice.id },
                relations: { items: true, vendor: true },
            });

            return res.status(200).json({
                message: "Invoice updated successfully",
                data: updatedInvoice,
            });
        } catch (error) {
            console.error("UpdateInvoice Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };

    public DeleteInvoice: RequestHandler = async (req: Request, res: Response) => {
        const invoiceId = req.params.id;
        if (!invoiceId) {
            return res.status(400).json({ message: "Missing invoice ID" });
        }
        try {
            const invoice = await InvoicesRepo.findOne({
                where: { id: invoiceId },
                relations: { items: true, vendor: true },
            });
            if (!invoice) {
                return res.status(404).json({ message: "Invoice not found" });
            }
            await InvoicesRepo.delete(invoiceId);
            res.status(200).json({ message: "Invoice deleted successfully", deleted: invoice });
        } catch (e) {
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
}

export default new InvoicesController();
