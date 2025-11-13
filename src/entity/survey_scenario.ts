import {
    Column,
    CreateDateColumn,
    Entity, JoinTable, ManyToMany,
    OneToMany, OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {ScenarioAssignment} from "../entity/scenario_assignments";
import {Questions} from "../entity/questions";
import {SimulatedSurvey} from "../entity/simulated_survey";

export const SURVEY_SCENARIOS_TABLE_NAME = 'survey_scenarios';

@Entity(SURVEY_SCENARIOS_TABLE_NAME)
export class SurveyScenario {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "int", name: "min_age"})
    minAge!: number;

    @Column({type: "int", name: "max_age"})
    maxAge!: number;

    @OneToOne(() => SimulatedSurvey, (simulatedSurvey) => simulatedSurvey.scenario, {
        cascade: true,
    })
    simulatedSurvey!: SimulatedSurvey;

    @Column({type: "varchar", length: 255, nullable: true})
    location!: string;

    @ManyToMany(() => Questions, { cascade: false })
    @JoinTable()
    questions!: Questions[];

    @Column({type: "int", default: 100})
    percentage!: number;

    @Column({type: "text", nullable: true})
    gender!: string;

    @Column({type: "text", default: "draft"})
    status!: string

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => ScenarioAssignment, (assignment) => assignment.scenario)
    assignments!: ScenarioAssignment[];

}