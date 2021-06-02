import {MigrationInterface, QueryRunner} from "typeorm";

export class EventTypeModule1621935725613 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event_type" ADD "module_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."event_type" ADD CONSTRAINT "FK_e1dac7f1105e294b7be674967c9" FOREIGN KEY ("module_id") REFERENCES "public"."module"("module_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event_type" DROP CONSTRAINT "FK_e1dac7f1105e294b7be674967c9"`);
        await queryRunner.query(`ALTER TABLE "public"."event_type" DROP COLUMN "module_id"`);
    }

}
