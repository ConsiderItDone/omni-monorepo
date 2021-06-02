import {MigrationInterface, QueryRunner} from "typeorm";

export class RootCertificate1622552420499 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ALTER COLUMN "owner" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ALTER COLUMN "key" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" DROP COLUMN "account_id"`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ADD "owner_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ADD "key_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ADD CONSTRAINT "FK_a2bc257b9b0602c16d7238c69bb" FOREIGN KEY ("owner_id") REFERENCES "public"."account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ADD CONSTRAINT "FK_a7fe85cdc88fdee271ca3dbffa7" FOREIGN KEY ("key_id") REFERENCES "public"."account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ADD CONSTRAINT "FK_ba28b57aaed05177173a52a51b8" FOREIGN KEY ("block_id") REFERENCES "public"."block"("block_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" DROP CONSTRAINT "FK_ba28b57aaed05177173a52a51b8"`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" DROP CONSTRAINT "FK_a7fe85cdc88fdee271ca3dbffa7"`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" DROP CONSTRAINT "FK_a2bc257b9b0602c16d7238c69bb"`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" DROP COLUMN "key_id"`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" DROP COLUMN "owner_id"`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ADD "account_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ALTER COLUMN "owner" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ALTER COLUMN "key" SET NOT NULL`);
    }

}
