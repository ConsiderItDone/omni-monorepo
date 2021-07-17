import {MigrationInterface, QueryRunner} from "typeorm";

export class PatchVersionApplication1626515343375 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."application" ADD "patch_version" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."application" DROP COLUMN "patch_version"`);
    }

}
