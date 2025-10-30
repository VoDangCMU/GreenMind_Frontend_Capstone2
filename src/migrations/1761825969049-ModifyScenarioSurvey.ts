import { MigrationInterface, QueryRunner } from "typeorm";

export class ModifyScenarioSurvey1761825969049 implements MigrationInterface {
    name = 'ModifyScenarioSurvey1761825969049'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "scenario_assignments" ADD "status" character varying NOT NULL DEFAULT 'not_assigned'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "scenario_assignments" DROP COLUMN "status"`);
    }

}
