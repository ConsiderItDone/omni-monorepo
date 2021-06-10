import {MigrationInterface, QueryRunner} from "typeorm";

export class ApplicationNullFields1622545065646 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."application" ALTER COLUMN "candidate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."application" ALTER COLUMN "challenger" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."application" ALTER COLUMN "candidate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."application" ALTER COLUMN "challenger" SET NOT NULL`);
    }

}
