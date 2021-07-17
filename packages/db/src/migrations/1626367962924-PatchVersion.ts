import {MigrationInterface, QueryRunner} from "typeorm";

export class PatchVersion1626367962924 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" ADD "patch_version" integer`);
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "patch_version" integer`);
        await queryRunner.query(`ALTER TABLE "public"."balance" ADD "patch_version" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."balance" DROP COLUMN "patch_version"`);
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN "patch_version"`);
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" DROP COLUMN "patch_version"`);
    }

}
