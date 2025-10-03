import { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import AppDataSource from "../infrastructure/database";
import { Invoices } from "../entity/invoices";
import { InvoiceItems } from "../entity/invoice_items";
import { Vendor } from "../entity/vendor";
import TEXT from "../config/schemas/Text";
import NUMBER from "../config/schemas/Number";
import BOOLEAN from "../config/schemas/Boolean";
import type { DeepPartial } from "typeorm";

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
    date: TEXT,
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


async function findOrCreateVendor(vendor: any): Promise<Vendor | null> {
    if (vendor?.name && vendor?.address) {
        let found = await VendorRepo.findOne({
            where: { name: vendor.name, address: vendor.address },
        });
        if (found) return found;

        const newVendor = VendorRepo.create({
            name: vendor.name,
            address: vendor.address,
            geoHint: vendor.geo_hint ?? null,
        });
        return await VendorRepo.save(newVendor);
    }
    return null;
}

function parseIssuedDate(datetime: any): Date | null {
    if (!datetime?.date) return null;
    const [day, month, year] = datetime.date.split("/");
    if (datetime.time) {
        return new Date(`${year}-${month}-${day}T${datetime.time}Z`);
    }
    return new Date(Date.UTC(+year, +month - 1, +day));
}

export class InvoicesController {
    public CreateInvoice: RequestHandler = async (req: Request, res: Response) => {
        const parsed = invoiceSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid input", error: parsed.error.format() });
        }

        try {
            const { doc, vendor, datetime, items, totals } = parsed.data;

            const newVendor = await findOrCreateVendor(vendor);
            const issuedDate = parseIssuedDate(datetime);

            const newInvoice = InvoicesRepo.create({
                currency: doc?.currency ?? "VND",
                paymentMethod: doc?.payment_method ?? "unknown",
                notes: doc?.notes ?? null,
                subtotal: totals?.subtotal ?? 0,
                discount: totals?.discount ?? 0,
                tax: totals?.tax ?? 0,
                grandTotal: totals?.grand_total ?? 0,
                issuedDate,
                vendor: newVendor ?? undefined,
            });
            await InvoicesRepo.save(newInvoice);

            for (const it of items) {
                const invoiceItem = InvoiceItemsRepo.create({
                    rawName: it.raw_name ?? null,
                    brand: it.brand ?? null,
                    category: it.category ?? null,
                    plantBased: it.plant_based ?? false,
                    quantity: it.quantity ?? 0,
                    unitPrice: it.unit_price ?? 0,
                    lineTotal: it.line_total ?? 0,
                    matchedShoppingList: it.matched_shopping_list ?? false,
                    invoice: newInvoice,
                } as DeepPartial<InvoiceItems>);
                await InvoiceItemsRepo.save(invoiceItem);
            }

            const fullInvoice = await InvoicesRepo.findOne({
                where: { id: newInvoice.id },
                relations: { items: true, vendor: true },
            });

            return res.status(201).json({ message: "Invoice created successfully", data: fullInvoice });
        } catch (error) {
            console.error("CreateInvoice Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };

    public GetInvoices: RequestHandler = async (_req, res) => {
        try {
            const invoices = await InvoicesRepo.find({
                relations: { items: true, vendor: true },
                order: { createdAt: "DESC" },
            });
            return res.status(200).json({ message: "Successfully", data: invoices });
        } catch (error) {
            console.error("GetInvoices Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };

    public GetInvoiceById: RequestHandler = async (req, res) => {
        try {
            const invoice = await InvoicesRepo.findOne({
                where: { id: req.params.id },
                relations: { items: true, vendor: true },
            });
            if (!invoice) return res.status(404).json({ message: "Invoice not found" });
            return res.status(200).json({ message: "Invoice found", data: invoice });
        } catch (e) {
            console.error("GetInvoiceById Error:", e);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };

    public UpdateInvoice: RequestHandler = async (req, res) => {
        const parsed = invoiceSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid input", error: parsed.error.format() });
        }

        try {
            const { doc, vendor, datetime, items, totals } = parsed.data;
            const existingInvoice = await InvoicesRepo.findOne({
                where: { id: req.params.id },
                relations: { items: true, vendor: true },
            });
            if (!existingInvoice) return res.status(404).json({ message: "Invoice not found" });

            const updatedVendor = await findOrCreateVendor(vendor);
            const issuedDate = parseIssuedDate(datetime);

            Object.assign(existingInvoice, {
                currency: doc?.currency ?? existingInvoice.currency,
                paymentMethod: doc?.payment_method ?? existingInvoice.paymentMethod,
                notes: doc?.notes ?? existingInvoice.notes,
                subtotal: totals?.subtotal ?? existingInvoice.subtotal,
                discount: totals?.discount ?? existingInvoice.discount,
                tax: totals?.tax ?? existingInvoice.tax,
                grandTotal: totals?.grand_total ?? existingInvoice.grandTotal,
                issuedDate: issuedDate ?? existingInvoice.issuedDate,
                vendor: updatedVendor ?? existingInvoice.vendor,
            });
            await InvoicesRepo.save(existingInvoice);

            if (items && items.length > 0) {
                await InvoiceItemsRepo.delete({ invoice: { id: existingInvoice.id } });
                for (const it of items) {
                    const invoiceItem = InvoiceItemsRepo.create({
                        rawName: it.raw_name ?? null,
                        brand: it.brand ?? null,
                        category: it.category ?? null,
                        plantBased: it.plant_based ?? false,
                        quantity: it.quantity ?? 0,
                        unitPrice: it.unit_price ?? 0,
                        lineTotal: it.line_total ?? 0,
                        matchedShoppingList: it.matched_shopping_list ?? false,
                        invoice: existingInvoice,
                    } as DeepPartial<InvoiceItems>);
                    await InvoiceItemsRepo.save(invoiceItem);
                }
            }

            const updatedInvoice = await InvoicesRepo.findOne({
                where: { id: existingInvoice.id },
                relations: { items: true, vendor: true },
            });
            return res.status(200).json({ message: "Invoice updated successfully", data: updatedInvoice });
        } catch (error) {
            console.error("UpdateInvoice Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };

    public DeleteInvoice: RequestHandler = async (req, res) => {
        try {
            const invoice = await InvoicesRepo.findOne({
                where: { id: req.params.id },
                relations: { items: true, vendor: true },
            });
            if (!invoice) return res.status(404).json({ message: "Invoice not found" });

            await InvoicesRepo.delete(invoice.id);
            return res.status(200).json({ message: "Invoice deleted successfully", deleted: invoice });
        } catch (e) {
            console.error("DeleteInvoice Error:", e);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };
}

export default new InvoicesController();
