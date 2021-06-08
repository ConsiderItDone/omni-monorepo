import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateModules1623124459700 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        const items = await queryRunner.query(`
            select call_module from public."extrinsic"
            group by call_module
            HAVING call_module is not null
        `);

        for (const obj of items) {
            let id;
            const moduleId = await queryRunner.query(`SELECT module_id from "public"."module" WHERE name='${obj.call_module}'`);

            if (moduleId && moduleId.length && moduleId[0].module_id) {
                id = moduleId[0].module_id;
            } else {
                const newModule = await queryRunner.query(`INSERT INTO "public"."module"("name") VALUES ('${obj.call_module}') RETURNING module_id;`);
                id = newModule[0].module_id;
            }

            await queryRunner.query(`UPDATE "public"."extrinsic" SET module_id=${id} WHERE call_module='${obj.call_module}'`);
        }
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" DROP COLUMN "call_module"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" ADD "call_module" character varying`);
    }

}
