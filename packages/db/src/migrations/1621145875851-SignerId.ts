import {MigrationInterface, QueryRunner} from "typeorm";

export class SignerId1621145875851 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" ADD "signer_id" integer`);
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" ADD CONSTRAINT "fk_signer_id" FOREIGN KEY ("signer_id") REFERENCES "public"."account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        const extrinsics = await queryRunner.query(`
            select signer from public."extrinsic" e
            group by signer
            HAVING signer  is not null 
        `);

        for (const ext of extrinsics) {
            let id;
            const accountId = await queryRunner.query(`SELECT account_id from "public"."account" WHERE address='${ext.signer}'`);

            if (accountId && accountId.length && accountId[0].account_id) {
                id = accountId[0].account_id;
            } else {
                const newAccount = await queryRunner.query(`INSERT INTO "public"."account"("address") VALUES ('${ext.signer}') RETURNING account_id;`);
                id = newAccount[0].account_id
            }

            await queryRunner.query(`UPDATE "public"."extrinsic" SET signer_id=${id} WHERE signer='${ext.signer}'`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" DROP CONSTRAINT "fk_signer_id"`);
        await queryRunner.query(`ALTER TABLE "public"."extrinsic" DROP COLUMN "signer_id"`);
    }

}
