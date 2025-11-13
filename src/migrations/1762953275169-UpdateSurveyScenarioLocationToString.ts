import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSurveyScenarioLocationToString1762953275169 implements MigrationInterface {
    name = 'UpdateSurveyScenarioLocationToString1762953275169'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if foreign key constraint exists before dropping
        const constraintExists = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'survey_scenarios' 
            AND constraint_name = 'FK_db7977c74d7540baa059bb89d38'
        `);

        if (constraintExists && constraintExists.length > 0) {
            await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP CONSTRAINT "FK_db7977c74d7540baa059bb89d38"`);
        }

        // Check if locationId column exists
        const columnExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'survey_scenarios' 
            AND column_name = 'locationId'
        `);

        if (columnExists && columnExists.length > 0) {
            await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP COLUMN "locationId"`);
        }

        // Add location as varchar if it doesn't exist
        const locationExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'survey_scenarios' 
            AND column_name = 'location'
        `);

        if (!locationExists || locationExists.length === 0) {
            await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD "location" character varying(255)`);
        } else {
            // If location column exists but is UUID type, convert it
            const columnType = await queryRunner.query(`
                SELECT data_type 
                FROM information_schema.columns 
                WHERE table_name = 'survey_scenarios' 
                AND column_name = 'location'
            `);

            if (columnType && columnType[0] && columnType[0].data_type === 'uuid') {
                await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP COLUMN "location"`);
                await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD "location" character varying(255)`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey_scenarios" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD "location" uuid`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" RENAME COLUMN "location" TO "locationId"`);
        await queryRunner.query(`ALTER TABLE "survey_scenarios" ADD CONSTRAINT "FK_db7977c74d7540baa059bb89d38" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
