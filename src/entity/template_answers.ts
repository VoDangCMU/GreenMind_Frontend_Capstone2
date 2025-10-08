import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn, UpdateDateColumn} from "typeorm";
import {Template} from "./templates";

export const TEMPLATE_ANSWER_TABLE_NAME = 'template_answers';

@Entity(TEMPLATE_ANSWER_TABLE_NAME)
export class TemplateAnswer {
    @PrimaryColumn({type:"varchar"})
    id!: string;

    @Column({type: "varchar"})
    type!: string;

    @Column({type: "json", nullable: true})
    scale?: number[];

    @Column({type: "json", nullable: true})
    labels?: string[];

    @Column({type: "json", nullable: true})
    options?: string[];

    @ManyToOne(() => Template, (template) => template.answers, {onDelete: "CASCADE"})
    template!: Template;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}