import {MigrationInterface, QueryRunner} from "typeorm";

export class Validator1620820723979 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "public"."validator" ("validator_id" SERIAL NOT NULL, "consumers" integer NOT NULL, "providers" integer NOT NULL, "account_id" integer NOT NULL, CONSTRAINT "REL_40066b8fd6843244dd5ed642a9" UNIQUE ("account_id"), CONSTRAINT "PK_327172b0737caa666e4407d6ead" PRIMARY KEY ("validator_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "validator_pk" ON "public"."validator" ("validator_id") `);
        await queryRunner.query(`ALTER TABLE "public"."validator" ADD CONSTRAINT "FK_40066b8fd6843244dd5ed642a92" FOREIGN KEY ("account_id") REFERENCES "public"."account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."validator" DROP CONSTRAINT "FK_40066b8fd6843244dd5ed642a92"`);
        await queryRunner.query(`DROP INDEX "public"."validator_pk"`);
        await queryRunner.query(`DROP TABLE "public"."validator"`);
    }

}
