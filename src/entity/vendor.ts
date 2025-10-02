import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Invoices } from "../entity/invoices";

const VENDOR_TABLE_NAME = "vendors";

@Entity(VENDOR_TABLE_NAME)
export class Vendor {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text" })
    name!: string;

    @Column({ type: "text" })
    address!: string;

    @Column({ type: "text", nullable: true })
    geo_hint!: string | null;

    @OneToMany(() => Invoices, (invoice) => invoice.vendor)
    invoices!: Invoices[];
}
