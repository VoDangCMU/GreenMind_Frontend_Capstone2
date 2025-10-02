import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./user";
import { Scans } from "./scans";
import { InvoiceItems } from "../entity/invoice_items";
import { Vendor } from "../entity/vendor";

export const INVOICES_TABLE_NAME = "invoices";

@Entity(INVOICES_TABLE_NAME)
export class Invoices {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Vendor, (vendor) => vendor.invoices, { eager: true })
    vendor!: Vendor;

    @ManyToOne(() => User, (user) => user.invoices, { onDelete: "CASCADE" })
    user!: User;

    @ManyToOne(() => Scans, (scans) => scans.invoices, { onDelete: "CASCADE" })
    scans!: Scans;

    @Column({ type: "text" })
    currency!: string;

    @Column({ type: "text" })
    payment_method!: string;

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @Column({ type: "date", nullable: true })
    issued_date!: Date | null;

    @Column({ type: "time", nullable: true })
    issued_time!: string | null;

    @Column({ type: "numeric" })
    subtotal!: number;

    @Column({ type: "numeric" })
    discount!: number;

    @Column({ type: "numeric" })
    tax!: number;

    @Column({ type: "numeric" })
    grand_total!: number;

    @OneToMany(() => InvoiceItems, (item) => item.invoice, { cascade: true })
    items!: InvoiceItems[];

    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    updatedAt!: Date;
}
