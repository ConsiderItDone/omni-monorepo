import {MigrationInterface, QueryRunner} from "typeorm";

export class DbIndexes1623125843736 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const sql = `
            create index extrinsic_block_id_index
                on extrinsic (block_id);

            create index extrinsic_hash_index
                on extrinsic (hash);
        `;

        await queryRunner.query(sql);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            drop index if exists extrinsic_hash_index;
            drop index if exists extrinsic_block_id_index;
        `);
    }

}
