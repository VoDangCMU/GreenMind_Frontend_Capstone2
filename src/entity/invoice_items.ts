import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Invoices } from "./invoices";

@Entity("invoice_items")
export class InvoiceItems {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Invoices, invoice => invoice.items, { onDelete: "CASCADE" })
    invoice!: Invoices;

    @Column({ type: "text" })
    raw_name!: string;

    @Column({ type: "text", nullable: true })
    brand!: string | null;

    @Column({ type: "text", nullable: true })
    category!: string | null;

    @Column({ type: "boolean", default: false })
    plant_based!: boolean;

    @Column({ type: "int" })
    quantity!: number;

    @Column({ type: "numeric" })
    unit_price!: number;

    @Column({ type: "numeric" })
    line_total!: number;

    @Column({ type: "boolean", default: false })
    matched_shopping_list!: boolean;
}
