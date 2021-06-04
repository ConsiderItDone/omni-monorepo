import {MigrationInterface, QueryRunner} from "typeorm";

export class UniqueFields1622781584014 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.removeDuplicates(queryRunner, 'event_type', 'event_type_id', 'name');
        await queryRunner.query(`ALTER TABLE "public"."event_type" ADD CONSTRAINT "UQ_16eee0bd1efc7e2135ca5ccb777" UNIQUE ("name")`);

        await this.removeDuplicates(queryRunner, 'extrinsic_type', 'extrinsic_type_id', 'name');
        await queryRunner.query(`ALTER TABLE "public"."extrinsic_type" ADD CONSTRAINT "UQ_557c26d811c73740bc0d8d1f86b" UNIQUE ("name")`);

        await this.removeDuplicates(queryRunner, 'module', 'module_id', 'name');
        await queryRunner.query(`ALTER TABLE "public"."module" ADD CONSTRAINT "UQ_57dfe911c8bfaec78acfd9d3637" UNIQUE ("name")`);

        await this.removeDuplicates(queryRunner, 'validator', 'validator_id', 'account_id');
        await queryRunner.query(`ALTER TABLE "public"."validator" ADD CONSTRAINT "UQ_40066b8fd6843244dd5ed642a92" UNIQUE ("account_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."validator" DROP CONSTRAINT "UQ_40066b8fd6843244dd5ed642a92"`);
        await queryRunner.query(`ALTER TABLE "public"."module" DROP CONSTRAINT "UQ_57dfe911c8bfaec78acfd9d3637"`);
        await queryRunner.query(`ALTER TABLE "public"."extrinsic_type" DROP CONSTRAINT "UQ_557c26d811c73740bc0d8d1f86b"`);
        await queryRunner.query(`ALTER TABLE "public"."event_type" DROP CONSTRAINT "UQ_16eee0bd1efc7e2135ca5ccb777"`);
    }

    public async removeDuplicates(queryRunner: QueryRunner, tableName: string, id: string, uniqueField: string) {
        await queryRunner.query(`
            DELETE FROM "public"."${tableName}"
            WHERE ${id} NOT IN (SELECT max(${id})
            FROM "public"."${tableName}"
            GROUP BY ${uniqueField})
        `);
    }

}
