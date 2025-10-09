import {Column, CreateDateColumn, Entity, OneToOne, JoinColumn, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Template} from "./templates";

export const TEMPLATE_ANSWER_TABLE_NAME = 'template_answers';

@Entity(TEMPLATE_ANSWER_TABLE_NAME)
export class TemplateAnswer {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "varchar"})
    type!: string;

    @Column({type: "json", nullable: true})
    scale?: number[];

    @Column({type: "json", nullable: true})
    labels?: string[];

    @Column({type: "json", nullable: true})
    options?: string[];

    @OneToOne(() => Template, (template) => template.answer, {onDelete: "CASCADE",})
    @JoinColumn()
    template!: Template;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;
}