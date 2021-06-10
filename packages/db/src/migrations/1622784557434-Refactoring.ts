import {MigrationInterface, QueryRunner} from "typeorm";

export class Refactoring1622784557434 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE "public"."root_certificate" DROP COLUMN IF EXISTS "owner"`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" DROP COLUMN IF EXISTS "key"`);

        // remove signer : start
        const extrinsics = await queryRunner.query(`
            select signer from public."extrinsic" e
            where signer_id is null
            group by signer
            HAVING signer is not null
        `);

        for (const ext of extrinsics) {
            let id;
            const accountId = await queryRunner.query(`SELECT account_id from "public"."account" WHERE address='${ext.signer}'`);
            if (accountId && accountId.length && accountId[0].account_id) {
                id = accountId[0].account_id;
            } else {
                const newAccount = await queryRunner.query(`INSERT INTO "public"."account"("address") VALUES ('${ext.signer}') RETURNING account_id;`);
                id = newAccount[0].account_id
            }

            await queryRunner.query(`UPDATE "public"."extrinsic" SET signer_id=${id} WHERE signer='${ext.signer}'`);
        }
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" DROP COLUMN "signer"`);
        // remove signer : end

        // remove event name : start
        const eventNames = await queryRunner.query(`
            select event_name from public."event" e
            where event_type_id is null
            group by event_name
            HAVING event_name is not null
        `);
        for (const obj of eventNames) {
            let id;
            const eventTypeId = await queryRunner.query(`SELECT event_type_id from "public"."event_type" WHERE name='${obj.event_name}'`);
            if (eventTypeId && eventTypeId.length && eventTypeId[0].event_type_id) {
                id = eventTypeId[0].event_type_id;
            } else {
                const newEventType = await queryRunner.query(`INSERT INTO "public"."event_type"("name") VALUES ('${obj.event_name}') RETURNING event_type_id;`);
                id = newEventType[0].event_type_id
            }

            await queryRunner.query(`UPDATE "public"."event" SET event_type_id=${id} WHERE event_name='${obj.event_name}'`);
        }
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN "event_name"`);
        // remove event name : end

        // remove module name : start
        const moduleNames = await queryRunner.query(`
            select module_name from public."event" e
            group by module_name
            HAVING module_name is not null
        `);
        for (const obj of moduleNames) {
            let id;
            const moduleId = await queryRunner.query(`SELECT module_id from "public"."module" WHERE name='${obj.module_name}'`);
            if (moduleId && moduleId.length && moduleId[0].module_id) {
                id = moduleId[0].module_id;
            } else {
                const moduleId = await queryRunner.query(`INSERT INTO "public"."module"("name") VALUES ('${obj.module_name}') RETURNING module_id;`);
                id = moduleId[0].module_id
            }

            await queryRunner.query(`UPDATE "public"."event" SET module_id=${id} WHERE module_name='${obj.module_name}' and module_id is null`);
        }
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN "module_name"`);
        // remove module name : end
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "event_name" character varying`);
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "module_name" character varying`);
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" ADD "signer" character varying`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ADD "key" character varying`);
        await queryRunner.query(`ALTER TABLE "public"."root_certificate" ADD "owner" character varying`);
    }

}
