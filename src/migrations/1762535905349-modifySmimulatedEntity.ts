import { MigrationInterface, QueryRunner } from "typeorm";

export class ModifySmimulatedEntity1762535905349 implements MigrationInterface {
    name = 'ModifySmimulatedEntity1762535905349'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" ADD "eligibleUsers" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" DROP COLUMN "eligibleUsers"`);
    }

}
