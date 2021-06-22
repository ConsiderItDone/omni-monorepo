import {getConnection, MigrationInterface, QueryRunner} from "typeorm";

export class DbIndexes1623125843734 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const sql = `
            create index if not exists extrinsic_block_id_index
                on extrinsic (block_id);
            
            create index if not exists event_block_id_index
                on event (block_id);
            
            create index if not exists extrinsic_is_signed_index
                on extrinsic (is_signed);
        `;

        await queryRunner.query(sql);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            drop index if exists extrinsic_is_signed_index;
            drop index if exists event_block_id_index;
            drop index if exists extrinsic_block_id_index;
        `);
    }

}
