import {MigrationInterface, QueryRunner} from "typeorm";

export class EventType1620969829928 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "public"."event_type" ("event_type_id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_a5cb804cd9a031602ce1db89b84" PRIMARY KEY ("event_type_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "event_type_pk" ON "public"."event_type" ("event_type_id") `);
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN IF EXISTS "type"`);
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "event_type_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."event" ADD CONSTRAINT "FK_94ee64ef46e924a91ec28642f3f" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_type"("event_type_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        const types = await queryRunner.query(`select event_name from public."event" e group by event_name `);
        for (const type of types) {
            await queryRunner.query(`INSERT INTO "public"."event_type"("name") VALUES ('${type.event_name}');`);
        }

        const eventTypes = await queryRunner.query(`select * from public."event_type"`);
        for (const type of eventTypes) {
            await queryRunner.query(`UPDATE "public"."event" SET event_type_id=${type.event_type_id} WHERE event_name='${type.name}'`);
        }

        await queryRunner.query(`ALTER TABLE public."event" ALTER COLUMN "event_name" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event" DROP CONSTRAINT "FK_94ee64ef46e924a91ec28642f3f"`);
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN "event_type_id"`);
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "type" character varying`);
        await queryRunner.query(`DROP INDEX "public"."event_type_pk"`);
        await queryRunner.query(`DROP TABLE "public"."event_type"`);

        await queryRunner.query(`ALTER TABLE public."event" ALTER COLUMN "event_name" SET NOT NULL`);
    }

}
