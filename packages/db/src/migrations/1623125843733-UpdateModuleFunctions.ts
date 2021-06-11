import {getConnection, MigrationInterface, QueryRunner} from "typeorm";

export class UpdateModuleFunctions1623125843733 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const modules = await queryRunner.query(`SELECT module_id from "public"."module"`);
        for (const module of modules) {
            const items = await queryRunner.query(`
                select call_module_function from public."extrinsic"
                where module_id=${module.module_id}
                group by call_module_function
                having call_module_function is not null
            `);

            for (const obj of items) {
                let id;
                const extrinsicType = await queryRunner.query(`SELECT extrinsic_type_id from "public"."extrinsic_type" WHERE name='${obj.call_module_function}' and module_id=${module.module_id}`);

                if (extrinsicType && extrinsicType.length && extrinsicType[0].extrinsic_type_id) {
                    id = extrinsicType[0].extrinsic_type_id;
                } else {
                    const newExtrinsicType = await queryRunner.query(`INSERT INTO "public"."extrinsic_type"("name", "module_id") VALUES ('${obj.call_module_function}', module.module_id) RETURNING extrinsic_type_id;`);
                    id = newExtrinsicType[0].extrinsic_type_id
                }

                await queryRunner.query(`UPDATE "public"."extrinsic" SET extrinsic_type_id=${id} WHERE call_module_function='${items.call_module_function} and module_id=${module.module_id}'`);
            }
        }

        await queryRunner.query(`ALTER TABLE "public"."extrinsic" DROP COLUMN "call_module_function"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" ADD "call_module_function" character varying`);
    }

}
