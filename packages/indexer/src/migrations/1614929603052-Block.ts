import {MigrationInterface, QueryRunner} from "typeorm";

export class Block1614929603052 implements MigrationInterface {
    name = 'Block1614929603052'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "public"."block" ("block_id" SERIAL NOT NULL, "number" integer NOT NULL, "timestamp" integer NOT NULL, "hash" character varying NOT NULL, "parent_hash" character varying NOT NULL, "state_root" character varying NOT NULL, "extrinsics_root" character varying NOT NULL, "spec_version" integer NOT NULL, "finalized" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_042f4b488f715ee1c97853a4a74" PRIMARY KEY ("block_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "block_pk" ON "public"."block" ("block_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."block_pk"`);
        await queryRunner.query(`DROP TABLE "public"."block"`);
    }

}
