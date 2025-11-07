import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTriggerByRelation1762545725322 implements MigrationInterface {
    name = 'FixTriggerByRelation1762545725322'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" DROP CONSTRAINT "FK_80cd28ac231072c3dbc1a2cc80e"`);
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" DROP CONSTRAINT "REL_80cd28ac231072c3dbc1a2cc80"`);
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" ADD CONSTRAINT "FK_80cd28ac231072c3dbc1a2cc80e" FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" DROP CONSTRAINT "FK_80cd28ac231072c3dbc1a2cc80e"`);
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" ADD CONSTRAINT "REL_80cd28ac231072c3dbc1a2cc80" UNIQUE ("triggeredById")`);
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" ADD CONSTRAINT "FK_80cd28ac231072c3dbc1a2cc80e" FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
