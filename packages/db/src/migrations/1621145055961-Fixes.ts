import {MigrationInterface, QueryRunner} from "typeorm";

export class Fixes1621145055961 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."balance" ALTER COLUMN "block_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."application" ALTER COLUMN "voters_for" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."application" ALTER COLUMN "voters_against" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."application" ALTER COLUMN "voters_against" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."application" ALTER COLUMN "voters_for" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."balance" ALTER COLUMN "block_id" SET NOT NULL`);
    }

}
