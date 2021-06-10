import {MigrationInterface, QueryRunner} from "typeorm";

export class AccountId1622518041721 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "account_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ADD "account_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."application" ADD "account_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."event" ADD CONSTRAINT "FK_602a0a7fbfc6021803f0598abe0" FOREIGN KEY ("account_id") REFERENCES "public"."account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ADD CONSTRAINT "FK_e779e8da87f83b74569efc605da" FOREIGN KEY ("account_id") REFERENCES "public"."account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."application" ADD CONSTRAINT "FK_65473942f884683a004a815b86a" FOREIGN KEY ("account_id") REFERENCES "public"."account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."application" DROP CONSTRAINT "FK_65473942f884683a004a815b86a"`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" DROP CONSTRAINT "FK_e779e8da87f83b74569efc605da"`);
        await queryRunner.query(`ALTER TABLE "public"."event" DROP CONSTRAINT "FK_602a0a7fbfc6021803f0598abe0"`);
        await queryRunner.query(`ALTER TABLE "public"."application" DROP COLUMN "account_id"`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" DROP COLUMN "account_id"`);
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN "account_id"`);
    }

}
