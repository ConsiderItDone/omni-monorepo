import {MigrationInterface, QueryRunner} from "typeorm";

export class Votes1622537744827 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "public"."vote" ("vote_id" SERIAL NOT NULL, "initiator_id" integer, "target_id" integer, "application_id" integer, "is_supported" boolean, CONSTRAINT "PK_cc12c681bad96d14e576057f565" PRIMARY KEY ("vote_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "vote_pk" ON "public"."vote" ("vote_id") `);
        await queryRunner.query(`ALTER TABLE "public"."application" DROP COLUMN "account_id"`);
        await queryRunner.query(`ALTER TABLE "public"."application" ADD "candidate_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."application" ADD "challenger_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."application" ADD CONSTRAINT "FK_7d1ecab63da5dcd0210b0b9c47f" FOREIGN KEY ("candidate_id") REFERENCES "public"."account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."application" ADD CONSTRAINT "FK_2141e3fad7235403b4e6b0ede02" FOREIGN KEY ("challenger_id") REFERENCES "public"."account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."vote" ADD CONSTRAINT "FK_20ced0f40a4938ebd89be52ae36" FOREIGN KEY ("initiator_id") REFERENCES "public"."account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."vote" ADD CONSTRAINT "FK_5e2e341d6281a46d43674e10ca1" FOREIGN KEY ("target_id") REFERENCES "public"."account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."vote" ADD CONSTRAINT "FK_69bd803920978a4513ef03c26f7" FOREIGN KEY ("application_id") REFERENCES "public"."application"("application_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN "account_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "account_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."vote" DROP CONSTRAINT "FK_69bd803920978a4513ef03c26f7"`);
        await queryRunner.query(`ALTER TABLE "public"."vote" DROP CONSTRAINT "FK_5e2e341d6281a46d43674e10ca1"`);
        await queryRunner.query(`ALTER TABLE "public"."vote" DROP CONSTRAINT "FK_20ced0f40a4938ebd89be52ae36"`);
        await queryRunner.query(`ALTER TABLE "public"."application" DROP CONSTRAINT "FK_2141e3fad7235403b4e6b0ede02"`);
        await queryRunner.query(`ALTER TABLE "public"."application" DROP CONSTRAINT "FK_7d1ecab63da5dcd0210b0b9c47f"`);
        await queryRunner.query(`ALTER TABLE "public"."application" DROP COLUMN "challenger_id"`);
        await queryRunner.query(`ALTER TABLE "public"."application" DROP COLUMN "candidate_id"`);
        await queryRunner.query(`ALTER TABLE "public"."application" ADD "account_id" integer`);
        await queryRunner.query(`DROP INDEX "public"."vote_pk"`);
        await queryRunner.query(`DROP TABLE "public"."vote"`);
    }

}
