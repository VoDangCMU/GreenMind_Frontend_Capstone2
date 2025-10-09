import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorTemplateAndTemplateAnswerEntity21760018554341 implements MigrationInterface {
    name = 'RefactorTemplateAndTemplateAnswerEntity21760018554341'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template_answers" ADD "templateId" character varying`);
        await queryRunner.query(`ALTER TABLE "template_answers" ADD CONSTRAINT "UQ_89e4150c9659d3c5b38d40d9634" UNIQUE ("templateId")`);
        await queryRunner.query(`ALTER TABLE "template_answers" ADD CONSTRAINT "FK_89e4150c9659d3c5b38d40d9634" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template_answers" DROP CONSTRAINT "FK_89e4150c9659d3c5b38d40d9634"`);
        await queryRunner.query(`ALTER TABLE "template_answers" DROP CONSTRAINT "UQ_89e4150c9659d3c5b38d40d9634"`);
        await queryRunner.query(`ALTER TABLE "template_answers" DROP COLUMN "templateId"`);
    }

}
