import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNightOutFreqEntity1763823342949 implements MigrationInterface {
    name = 'CreateNightOutFreqEntity1763823342949'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP CONSTRAINT "FK_db7977c74d7540baa059bb89d38"`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" RENAME COLUMN "locationId" TO "location"`);
        await queryRunner.query(`CREATE TABLE "metrics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "metric" character varying(100) NOT NULL, "vt" double precision NOT NULL, "bt" double precision NOT NULL, "r" double precision NOT NULL, "n" double precision NOT NULL, "contrib" double precision, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5283cad666a83376e28a715bf0e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "healthy_food_ratio" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "plantMeals" integer NOT NULL, "totalMeals" integer NOT NULL, "baseLikert" integer NOT NULL DEFAULT '4', "weight" double precision NOT NULL DEFAULT '0.25', "direction" character varying(10) NOT NULL DEFAULT 'up', "sigmaR" double precision NOT NULL DEFAULT '1', "alpha" double precision NOT NULL DEFAULT '0.5', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_93fd1fd6c6b483d6a2c4ac4315c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "avg_daily_spend" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "totalDaily" double precision NOT NULL, "baseAvg" double precision NOT NULL, "weight" double precision NOT NULL, "sigma_r" double precision NOT NULL, "alpha" double precision NOT NULL, "direction" text NOT NULL, "metric" character varying, "vt" double precision, "bt" double precision, "r" double precision, "n" double precision, "contrib" double precision, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "bigFiveBeforeId" uuid, "bigFiveAfterId" uuid, CONSTRAINT "PK_7c328b5b1377787a67ac83ac72e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "length_to_previous_location" double precision`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD "location" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT '0.2'`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "metrics" ADD CONSTRAINT "FK_592d7eb22e009bb856cc14db1a5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "healthy_food_ratio" ADD CONSTRAINT "FK_ace48dfa24c20b9282a35717c8e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD CONSTRAINT "FK_b36c30be7be533535b311bcf901" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD CONSTRAINT "FK_f61f525ad49bb010be30a4fe4ae" FOREIGN KEY ("bigFiveBeforeId") REFERENCES "big_five"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" ADD CONSTRAINT "FK_5b941064230f580cdf3ca97bde7" FOREIGN KEY ("bigFiveAfterId") REFERENCES "big_five"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP CONSTRAINT "FK_5b941064230f580cdf3ca97bde7"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP CONSTRAINT "FK_f61f525ad49bb010be30a4fe4ae"`);
        await queryRunner.query(`ALTER TABLE "avg_daily_spend" DROP CONSTRAINT "FK_b36c30be7be533535b311bcf901"`);
        await queryRunner.query(`ALTER TABLE "healthy_food_ratio" DROP CONSTRAINT "FK_ace48dfa24c20b9282a35717c8e"`);
        await queryRunner.query(`ALTER TABLE "metrics" DROP CONSTRAINT "FK_592d7eb22e009bb856cc14db1a5"`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "alpha" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "night_out_freq" ALTER COLUMN "weight" SET DEFAULT 0.2`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD "location" uuid`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "length_to_previous_location"`);
        await queryRunner.query(`DROP TABLE "avg_daily_spend"`);
        await queryRunner.query(`DROP TABLE "healthy_food_ratio"`);
        await queryRunner.query(`DROP TABLE "metrics"`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" RENAME COLUMN "location" TO "locationId"`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD CONSTRAINT "FK_db7977c74d7540baa059bb89d38" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
