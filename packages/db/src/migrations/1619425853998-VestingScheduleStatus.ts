import {MigrationInterface, QueryRunner} from "typeorm";

export class VestingScheduleStatus1619425853998 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."vesting_schedule" DROP COLUMN "status"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."vesting_schedule" ADD "status" character varying`);
    }

}
