import {MigrationInterface, QueryRunner} from "typeorm";

export class DbIndexes1623125843737 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const sql = `
            create index extrinsic_signer_id_index
                on extrinsic (signer_id);
        `;

        await queryRunner.query(sql);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            drop index if exists extrinsic_signer_id_index;
        `);
    }

}
