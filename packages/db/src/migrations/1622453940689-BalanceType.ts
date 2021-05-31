import {MigrationInterface, QueryRunner} from "typeorm";

export class BalanceType1622453940689 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."balance" ALTER COLUMN "free" TYPE character varying`);
        await queryRunner.query(`ALTER TABLE "public"."balance" ALTER COLUMN "reserved" TYPE character varying`);
        await queryRunner.query(`ALTER TABLE "public"."balance" ALTER COLUMN "misc_frozen" TYPE character varying`);
        await queryRunner.query(`ALTER TABLE "public"."balance" ALTER COLUMN "fee_frozen" TYPE character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."balance" ALTER COLUMN "free" TYPE bigint`);
        await queryRunner.query(`ALTER TABLE "public"."balance" ALTER COLUMN "reserved" TYPE bigint`);
        await queryRunner.query(`ALTER TABLE "public"."balance" ALTER COLUMN "misc_frozen" TYPE bigint`);
        await queryRunner.query(`ALTER TABLE "public"."balance" ALTER COLUMN "fee_frozen" TYPE bigint`);
    }

}
