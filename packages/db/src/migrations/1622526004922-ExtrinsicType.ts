import {MigrationInterface, QueryRunner} from "typeorm";

export class ExtrinsicType1622526004922 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" ADD "extrinsic_type_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" ADD "module_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" ADD CONSTRAINT "FK_e81dd46641a51705544aeb9c568" FOREIGN KEY ("extrinsic_type_id") REFERENCES "public"."extrinsic_type"("extrinsic_type_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" ADD CONSTRAINT "FK_c59a4706e094ae7ea7434047e74" FOREIGN KEY ("module_id") REFERENCES "public"."module"("module_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" DROP CONSTRAINT "FK_c59a4706e094ae7ea7434047e74"`);
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" DROP CONSTRAINT "FK_e81dd46641a51705544aeb9c568"`);
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" DROP COLUMN "module_id"`);
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" DROP COLUMN "extrinsic_type_id"`);
    }

}
