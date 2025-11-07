import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSimulatedEntity1762392608657 implements MigrationInterface {
    name = 'AddSimulatedEntity1762392608657'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "simulated_survey_scenarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "totalEligible" integer NOT NULL, "targetCount" integer NOT NULL, "assignedCount" integer NOT NULL DEFAULT '0', "unassignedCount" integer NOT NULL DEFAULT '0', "status" character varying(50) NOT NULL DEFAULT 'completed', "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "scenarioId" uuid, "triggeredById" uuid, CONSTRAINT "REL_234b12bdd71919aa950f08a4a4" UNIQUE ("scenarioId"), CONSTRAINT "REL_80cd28ac231072c3dbc1a2cc80" UNIQUE ("triggeredById"), CONSTRAINT "PK_f97115b372136a12ba8e09c3eee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" ADD CONSTRAINT "FK_234b12bdd71919aa950f08a4a44" FOREIGN KEY ("scenarioId") REFERENCES "survey_scenarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" ADD CONSTRAINT "FK_80cd28ac231072c3dbc1a2cc80e" FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" DROP CONSTRAINT "FK_80cd28ac231072c3dbc1a2cc80e"`);
        await queryRunner.query(`ALTER TABLE "simulated_survey_scenarios" DROP CONSTRAINT "FK_234b12bdd71919aa950f08a4a44"`);
        await queryRunner.query(`DROP TABLE "simulated_survey_scenarios"`);
    }

}
