import {MigrationInterface, QueryRunner} from "typeorm";

export class ExtrinsicType1622524352983 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "public"."extrinsic_type" ("extrinsic_type_id" SERIAL NOT NULL, "name" character varying NOT NULL, "module_id" integer, CONSTRAINT "PK_35032da9fcba3a883e3054a48f7" PRIMARY KEY ("extrinsic_type_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "extrinsic_type_pk" ON "public"."extrinsic_type" ("extrinsic_type_id") `);
        await queryRunner.query(`ALTER TABLE "public"."extrinsic_type" ADD CONSTRAINT "FK_ef0af9d238a74bacf599ccbd61a" FOREIGN KEY ("module_id") REFERENCES "public"."module"("module_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."extrinsic_type" DROP CONSTRAINT "FK_ef0af9d238a74bacf599ccbd61a"`);
        await queryRunner.query(`DROP INDEX "public"."extrinsic_type_pk"`);
        await queryRunner.query(`DROP TABLE "public"."extrinsic_type"`);
    }

}
