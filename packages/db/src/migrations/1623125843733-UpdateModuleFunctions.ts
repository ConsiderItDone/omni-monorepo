import {getConnection, MigrationInterface, QueryRunner} from "typeorm";
import ExtrinsicTypeRepository from "../repositories/public/extrinsicTypeRepository";

export class UpdateModuleFunctions1623125843733 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const extrinsicTypeRepository = getConnection().getCustomRepository(ExtrinsicTypeRepository);

        const modules = await queryRunner.query(`SELECT module_id from "public"."module"`);
        for (const module of modules) {
            const items = await queryRunner.query(`
                select call_module_function from public."extrinsic"
                where module_id=${module.module_id}
                group by call_module_function
                having call_module_function is not null
            `);

            for (const obj of items) {
                const extType = await extrinsicTypeRepository.addOrIgnore({
                    name: obj.call_module_function,
                    moduleId: module.module_id,
                });
                await queryRunner.query(`UPDATE "public"."extrinsic" SET extrinsic_type_id=${extType.extrinsicTypeId} WHERE call_module_function='${items.call_module_function} and module_id=${module.module_id}'`);
            }
        }

        await queryRunner.query(`ALTER TABLE "public"."extrinsic" DROP COLUMN "call_module_function"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" ADD "call_module_function" character varying`);
    }

}
