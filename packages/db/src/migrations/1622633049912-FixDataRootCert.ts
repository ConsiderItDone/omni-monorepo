import {MigrationInterface, QueryRunner} from "typeorm";

export class FixDataRootCert1622633049912 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const certOwners = await queryRunner.query(`select owner from public."root_certificate" e group by owner `);
        for (const cert of certOwners) {
            let id;
            const accountId = await queryRunner.query(`SELECT account_id from "public"."account" WHERE address='${cert.owner}'`);

            if (accountId && accountId.length && accountId[0].account_id) {
                id = accountId[0].account_id;
            } else {
                const newAccount = await queryRunner.query(`INSERT INTO "public"."account"("address") VALUES ('${cert.owner}') RETURNING account_id;`);
                id = newAccount[0].account_id
            }

            await queryRunner.query(`UPDATE "public"."root_certificate" SET owner_id=${id} WHERE owner='${cert.owner}'`);
        }

        const certKeys = await queryRunner.query(`select key from public."root_certificate" e group by key `);
        for (const cert of certKeys) {
            let id;
            const accountId = await queryRunner.query(`SELECT account_id from "public"."account" WHERE address='${cert.key}'`);

            if (accountId && accountId.length && accountId[0].account_id) {
                id = accountId[0].account_id;
            } else {
                const newAccount = await queryRunner.query(`INSERT INTO "public"."account"("address") VALUES ('${cert.key}') RETURNING account_id;`);
                id = newAccount[0].account_id
            }

            await queryRunner.query(`UPDATE "public"."root_certificate" SET key_id=${id} WHERE owner='${cert.key}'`);
        }

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
