import {MigrationInterface, QueryRunner} from "typeorm";

export class VestingScheduleAccount1618917081584 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."vesting_schedule" DROP COLUMN "account_address"`);
        await queryRunner.query(`ALTER TABLE "public"."vesting_schedule" ADD "account_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."vesting_schedule" ADD CONSTRAINT "FK_8b85d6b4975df64128d8cbf85db" FOREIGN KEY ("account_id") REFERENCES "public"."account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."vesting_schedule" ADD CONSTRAINT "FK_7c8b398739341234905708e0c18" FOREIGN KEY ("block_id") REFERENCES "public"."block"("block_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."vesting_schedule" DROP CONSTRAINT "FK_7c8b398739341234905708e0c18"`);
        await queryRunner.query(`ALTER TABLE "public"."vesting_schedule" DROP CONSTRAINT "FK_8b85d6b4975df64128d8cbf85db"`);
        await queryRunner.query(`ALTER TABLE "public"."vesting_schedule" DROP COLUMN "account_id"`);
        await queryRunner.query(`ALTER TABLE "public"."vesting_schedule" ADD "account_address" character varying NOT NULL`);
    }

}
