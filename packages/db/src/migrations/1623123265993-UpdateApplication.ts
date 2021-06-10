import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateApplication1623123265993 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        {
            const items = await queryRunner.query(`
                select candidate from public."application"
                where candidate_id is null
                group by candidate
                HAVING candidate is not null
            `);
            for (const obj of items) {
                let id;
                const accountId = await queryRunner.query(`SELECT account_id from "public"."account" WHERE address='${obj.candidate}'`);

                if (accountId && accountId.length && accountId[0].account_id) {
                    id = accountId[0].account_id;
                } else {
                    const newAccount = await queryRunner.query(`INSERT INTO "public"."account"("address") VALUES ('${obj.candidate}') RETURNING account_id;`);
                    id = newAccount[0].account_id
                }

                await queryRunner.query(`UPDATE "public"."application" SET candidate_id=${id} WHERE candidate='${obj.candidate}'`);
            }
            await queryRunner.query(`ALTER TABLE "public"."application" DROP COLUMN "candidate"`);
        }
        {
            const items = await queryRunner.query(`
                select challenger from public."application"
                where challenger_id is null
                group by challenger
                HAVING challenger is not null
            `);
            for (const obj of items) {
                let id;
                const accountId = await queryRunner.query(`SELECT account_id from "public"."account" WHERE address='${obj.challenger}'`);

                if (accountId && accountId.length && accountId[0].account_id) {
                    id = accountId[0].account_id;
                } else {
                    const newAccount = await queryRunner.query(`INSERT INTO "public"."account"("address") VALUES ('${obj.challenger}') RETURNING account_id;`);
                    id = newAccount[0].account_id
                }

                await queryRunner.query(`UPDATE "public"."application" SET challenger_id=${id} WHERE challenger='${obj.challenger}'`);
            }
            await queryRunner.query(`ALTER TABLE "public"."application" DROP COLUMN "challenger"`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."application" ADD "candidate" character varying `);
        await queryRunner.query(`ALTER TABLE "public"."application" ADD "challenger" character varying `);
    }

}
