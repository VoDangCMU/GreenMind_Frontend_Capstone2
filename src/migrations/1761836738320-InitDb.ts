import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDb1761836738320 implements MigrationInterface {
    name = 'InitDb1761836738320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "scenario_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying NOT NULL DEFAULT 'not_assigned', "createAt" TIMESTAMP NOT NULL DEFAULT now(), "scenarioId" uuid, "userId" uuid, CONSTRAINT "PK_b4ab2875fe573a9dd586c2258d4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "survey_scenarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "min_age" integer NOT NULL, "max_age" integer NOT NULL, "percentage" integer NOT NULL DEFAULT '100', "status" text NOT NULL DEFAULT 'draft', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "locationId" uuid, CONSTRAINT "PK_2a8abdb9af9184093d7f798446d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "survey_scenarios_questions_questions" ("surveyScenariosId" uuid NOT NULL, "questionsId" uuid NOT NULL, CONSTRAINT "PK_67aa56f0b342c6145f9beab75e1" PRIMARY KEY ("surveyScenariosId", "questionsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_db5e012d7cb7dc89eb5ad05f93" ON "survey_scenarios_questions_questions" ("surveyScenariosId") `);
        await queryRunner.query(`CREATE INDEX "IDX_82c5b9231e8632d637824d85bc" ON "survey_scenarios_questions_questions" ("questionsId") `);
        await queryRunner.query(`ALTER TABLE "scenario_assignments" ADD CONSTRAINT "FK_fc372c04f9d8ca49d63ada19f9a" FOREIGN KEY ("scenarioId") REFERENCES "survey_scenarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scenario_assignments" ADD CONSTRAINT "FK_a75aa9e067b1ac29c7dd6b2b63f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD CONSTRAINT "FK_db7977c74d7540baa059bb89d38" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios_questions_questions" ADD CONSTRAINT "FK_db5e012d7cb7dc89eb5ad05f938" FOREIGN KEY ("surveyScenariosId") REFERENCES "survey_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios_questions_questions" ADD CONSTRAINT "FK_82c5b9231e8632d637824d85bcc" FOREIGN KEY ("questionsId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey_scenarios_questions_questions" DROP CONSTRAINT "FK_82c5b9231e8632d637824d85bcc"`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios_questions_questions" DROP CONSTRAINT "FK_db5e012d7cb7dc89eb5ad05f938"`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP CONSTRAINT "FK_db7977c74d7540baa059bb89d38"`);
        await queryRunner.query(`ALTER TABLE "scenario_assignments" DROP CONSTRAINT "FK_a75aa9e067b1ac29c7dd6b2b63f"`);
        await queryRunner.query(`ALTER TABLE "scenario_assignments" DROP CONSTRAINT "FK_fc372c04f9d8ca49d63ada19f9a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_82c5b9231e8632d637824d85bc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db5e012d7cb7dc89eb5ad05f93"`);
        await queryRunner.query(`DROP TABLE "survey_scenarios_questions_questions"`);
        await queryRunner.query(`DROP TABLE "survey_scenarios"`);
        await queryRunner.query(`DROP TABLE "scenario_assignments"`);
    }

}
