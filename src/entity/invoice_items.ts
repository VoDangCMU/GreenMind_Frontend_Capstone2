import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Invoices } from "./invoices";

@Entity("invoice_items")
export class InvoiceItems {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Invoices, (invoice) => invoice.items, { onDelete: "CASCADE" })
    invoice!: Invoices;

    @Column({ name: "raw_name", type: "text", nullable: true })
    rawName!: string | null;

    @Column({ type: "text", nullable: true })
    brand!: string | null;

    @Column({ type: "text", nullable: true })
    category!: string | null;

    @Column({ name: "plant_based", type: "boolean", default: false })
    plantBased!: boolean;

    @Column({ type: "int" })
    quantity!: number;

    @Column({ name: "unit_price", type: "numeric" })
    unitPrice!: number;

    @Column({ name: "line_total", type: "numeric" })
    lineTotal!: number;

    @Column({ name: "matched_shopping_list", type: "boolean", default: false })
    matchedShoppingList!: boolean;
}
