import {MigrationInterface, QueryRunner} from "typeorm";

export class ExtrinsicIdIndexOnEventTable1649666508493 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const sql =`CREATE INDEX event_extrinsic_id_index ON event USING btree (extrinsic_id)`
        
        await queryRunner.query(sql);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        drop index if exists event_extrinsic_id_index;
    `);
    }

}
