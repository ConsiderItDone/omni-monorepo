import {MigrationInterface, QueryRunner} from "typeorm";

export class NotUniqueName1623045680954 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event_type" DROP CONSTRAINT "UQ_16eee0bd1efc7e2135ca5ccb777"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event_type" ADD CONSTRAINT "UQ_16eee0bd1efc7e2135ca5ccb777" UNIQUE ("name")`);
    }

}
