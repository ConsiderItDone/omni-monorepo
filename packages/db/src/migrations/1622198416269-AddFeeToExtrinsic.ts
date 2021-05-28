import {MigrationInterface, QueryRunner} from "typeorm";

export class AddFeeToExtrinsic1622198416269 implements MigrationInterface {
    name = 'AddFeeToExtrinsic1622198416269'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" ADD "fee" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" DROP COLUMN "fee"`);
    }

}
