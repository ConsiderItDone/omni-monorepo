import {MigrationInterface, QueryRunner} from "typeorm";

export class CallModuleFunc1622526136433 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE public."extrinsic" ALTER COLUMN "call_module_function" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE public."extrinsic" ALTER COLUMN "call_module" DROP NOT NULL`);
}

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE public."extrinsic" ALTER COLUMN "call_module_function" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE public."extrinsic" ALTER COLUMN "call_module" SET NOT NULL`);
    }

}
