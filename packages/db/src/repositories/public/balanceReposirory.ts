import { EntityRepository, Repository } from "typeorm";
import { Balance } from "../../models";

type NewBalanceParam = {
  free: number;
  reserved: number;
  miscFrozen: number;
  feeFrozen: number;
  accountId: number;
};

@EntityRepository(Balance)
export default class BalanceRepository extends Repository<Balance> {
  public async add({
    free,
    reserved,
    miscFrozen,
    feeFrozen,
    accountId,
  }: NewBalanceParam): Promise<Balance> {
    return await this.save({
      free,
      reserved,
      miscFrozen,
      feeFrozen,
      accountId,
    });
  }
}
