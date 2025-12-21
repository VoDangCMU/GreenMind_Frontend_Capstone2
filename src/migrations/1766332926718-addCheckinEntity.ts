import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCheckinEntity1766332926718 implements MigrationInterface {
    name = 'AddCheckinEntity1766332926718'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "checkins" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "latitude" numeric(10,7) NOT NULL, "longitude" numeric(10,7) NOT NULL, "location" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_99c62633386398b154840f0708c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "checkins" ADD CONSTRAINT "FK_44e41f5a4e9ea07b3aa58eb0051" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checkins" DROP CONSTRAINT "FK_44e41f5a4e9ea07b3aa58eb0051"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`DROP TABLE "checkins"`);
    }

}
