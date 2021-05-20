import {MigrationInterface, QueryRunner} from "typeorm";

export class Module1621488253437 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "public"."module" ("module_id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "module_pk" PRIMARY KEY ("module_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "module_uniq_pk" ON "public"."module" ("module_id") `);
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "module_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."event" ADD CONSTRAINT "fk_module_id" FOREIGN KEY ("module_id") REFERENCES "public"."module"("module_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        const types = await queryRunner.query(`select module_name from public."event" e group by module_name `);
        for (const type of types) {
            await queryRunner.query(`INSERT INTO "public"."module"("name") VALUES ('${type.module_name}');`);
        }

        const modules = await queryRunner.query(`select * from public."module"`);
        for (const module of modules) {
            await queryRunner.query(`UPDATE "public"."event" SET module_id=${module.module_id} WHERE module_name='${module.name}'`);
        }

        await queryRunner.query(`ALTER TABLE public."event" ALTER COLUMN "module_name" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event" DROP CONSTRAINT "fk_module_id"`);
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN "module_id"`);
        await queryRunner.query(`DROP INDEX "public"."module_uniq_pk"`);
        await queryRunner.query(`DROP TABLE "public"."module"`);
    }

}
