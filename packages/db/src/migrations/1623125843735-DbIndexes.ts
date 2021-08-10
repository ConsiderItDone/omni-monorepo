import {MigrationInterface, QueryRunner} from "typeorm";

export class DbIndexes1623125843735 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const sql = `
            create index if not exists account_address_index
                on account (address);
        `;

        await queryRunner.query(sql);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            drop index if exists account_address_index;
        `);
    }

}
