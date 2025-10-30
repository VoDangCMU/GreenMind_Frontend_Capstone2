import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDb1761783019244 implements MigrationInterface {
    name = 'InitDb1761783019244'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_f4e45583cbe6aaa143cdfeaae09"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "gender" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "location" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_f4e45583cbe6aaa143cdfeaae09" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_f4e45583cbe6aaa143cdfeaae09"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "gender"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_f4e45583cbe6aaa143cdfeaae09" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
