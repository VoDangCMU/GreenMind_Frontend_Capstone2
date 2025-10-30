import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {User} from "./user";
import {SurveyScenario} from "../entity/survey_scenario";

export const LOCATIONS_TABLE_NAME = 'locations';

@Entity(LOCATIONS_TABLE_NAME)
export class Locations {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE'})
    user!: User;

    @Column({type: 'double precision'})
    latitude!: number;

    @Column({type: 'double precision'})
    longitude!: number;

    @Column({type: 'text'})
    address!: string;

    @CreateDateColumn({type: 'timestamp'})
    createdAt!: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt!: Date;

    @OneToMany(() => SurveyScenario, surveyScenario => surveyScenario.location)
    surveyScenarios!: SurveyScenario[];
}