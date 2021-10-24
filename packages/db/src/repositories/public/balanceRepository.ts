import { EntityRepository, Repository } from "typeorm";
import { Balance } from "../../models";

type NewBalanceParam = {
  free: string;
  reserved: string;
  miscFrozen: string;
  feeFrozen: string;
  accountId: number;
  blockId?: number;
};

@EntityRepository(Balance)
export default class BalanceRepository extends Repository<Balance> {
  public async add({ free, reserved, miscFrozen, feeFrozen, accountId, blockId }: NewBalanceParam): Promise<Balance> {
    return await this.save({
      free,
      reserved,
      miscFrozen,
      feeFrozen,
      accountId,
      blockId,
    });
  }

  public async replace(balanceId: number, balanceData: NewBalanceParam): Promise<Balance> {
    return await this.save({
      balanceId,
      ...balanceData,
    });
  }
  
  public async getBalanceByAddress(address: string) {
    const result = await this.query(`
        SELECT "balance"."balance_id"    AS "balanceId",
               "balance"."free"          AS "free",
               "balance"."reserved"      AS "reserved",
               "balance"."misc_frozen"   AS "miscFrozen",
               "balance"."fee_frozen"    AS "feeFrozen",
               "balance"."account_id"    AS "accountId",
               "balance"."block_id"      AS "blockId"
        FROM "public"."balance" "balance"
                 INNER JOIN "public"."account" "account" ON "account"."account_id" = "balance"."account_id"
                 INNER JOIN "public"."block" "block" ON "block"."block_id" = "balance"."block_id"
        WHERE "account"."address" = $1
        ORDER BY "block"."number" DESC 
        LIMIT 1`, [ address ]);
    
    if (!result) {
      return null;
    }

    return this.create(result[0]);
  }
}
