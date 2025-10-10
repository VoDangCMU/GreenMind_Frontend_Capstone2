import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDb1760064722889 implements MigrationInterface {
    name = 'InitDb1760064722889'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "location" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
    }

}
