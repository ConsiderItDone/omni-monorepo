import {MigrationInterface, QueryRunner} from "typeorm";

export class VestingPerPeriodType1650372773489 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."vesting_schedule" ALTER COLUMN "per_period" TYPE character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."vesting_schedule" ALTER COLUMN "per_period" TYPE bigint`);
    }

}
