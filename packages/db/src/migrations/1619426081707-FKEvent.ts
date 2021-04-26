import {MigrationInterface, QueryRunner} from "typeorm";

export class FKEvent1619426081707 implements MigrationInterface {
    name = 'FKEvent1619426081707'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" ADD CONSTRAINT "FK_824174b8875235aaa4e46a9dd9e" FOREIGN KEY ("block_id") REFERENCES "public"."block"("block_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."event" ADD CONSTRAINT "FK_1f8218788cbcd171dbe29b4f67c" FOREIGN KEY ("extrinsic_id") REFERENCES "public"."extrinsic"("extrinsic_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."log" ADD CONSTRAINT "FK_cfc5b7584ff6e74451b1e8da6b3" FOREIGN KEY ("block_id") REFERENCES "public"."block"("block_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ADD CONSTRAINT "FK_ba28b57aaed05177173a52a51b8" FOREIGN KEY ("block_id") REFERENCES "public"."block"("block_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."balance" ADD CONSTRAINT "FK_ae6d068158f3663cc6f7f09856a" FOREIGN KEY ("block_id") REFERENCES "public"."block"("block_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."balance" ADD CONSTRAINT "FK_663d99f58fc86027558cf14f908" FOREIGN KEY ("account_id") REFERENCES "public"."account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."application" ADD CONSTRAINT "FK_2b11f7a5455aaef4ce8a9e5d468" FOREIGN KEY ("block_id") REFERENCES "public"."block"("block_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."application" DROP CONSTRAINT "FK_2b11f7a5455aaef4ce8a9e5d468"`);
        await queryRunner.query(`ALTER TABLE "public"."balance" DROP CONSTRAINT "FK_663d99f58fc86027558cf14f908"`);
        await queryRunner.query(`ALTER TABLE "public"."balance" DROP CONSTRAINT "FK_ae6d068158f3663cc6f7f09856a"`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" DROP CONSTRAINT "FK_ba28b57aaed05177173a52a51b8"`);
        await queryRunner.query(`ALTER TABLE "public"."log" DROP CONSTRAINT "FK_cfc5b7584ff6e74451b1e8da6b3"`);
        await queryRunner.query(`ALTER TABLE "public"."event" DROP CONSTRAINT "FK_1f8218788cbcd171dbe29b4f67c"`);
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" DROP CONSTRAINT "FK_824174b8875235aaa4e46a9dd9e"`);
    }

}
