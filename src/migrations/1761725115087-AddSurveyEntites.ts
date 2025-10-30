import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSurveyEntites1761725115087 implements MigrationInterface {
    name = 'AddSurveyEntites1761725115087'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "survey_scenarios_questions_questions" ("surveyScenariosId" uuid NOT NULL, "questionsId" uuid NOT NULL, CONSTRAINT "PK_67aa56f0b342c6145f9beab75e1" PRIMARY KEY ("surveyScenariosId", "questionsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_db5e012d7cb7dc89eb5ad05f93" ON "survey_scenarios_questions_questions" ("surveyScenariosId") `);
        await queryRunner.query(`CREATE INDEX "IDX_82c5b9231e8632d637824d85bc" ON "survey_scenarios_questions_questions" ("questionsId") `);
        await queryRunner.query(`ALTER TABLE "survey_scenarios_questions_questions" ADD CONSTRAINT "FK_db5e012d7cb7dc89eb5ad05f938" FOREIGN KEY ("surveyScenariosId") REFERENCES "survey_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios_questions_questions" ADD CONSTRAINT "FK_82c5b9231e8632d637824d85bcc" FOREIGN KEY ("questionsId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey_scenarios_questions_questions" DROP CONSTRAINT "FK_82c5b9231e8632d637824d85bcc"`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios_questions_questions" DROP CONSTRAINT "FK_db5e012d7cb7dc89eb5ad05f938"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_82c5b9231e8632d637824d85bc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db5e012d7cb7dc89eb5ad05f93"`);
        await queryRunner.query(`DROP TABLE "survey_scenarios_questions_questions"`);
    }

}
