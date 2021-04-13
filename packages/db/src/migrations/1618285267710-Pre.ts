import { MigrationInterface, QueryRunner } from "typeorm";

export class Pre1618285267710 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // init migration tables
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
