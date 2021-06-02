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
  public async add({
    free,
    reserved,
    miscFrozen,
    feeFrozen,
    accountId,
    blockId,
  }: NewBalanceParam): Promise<Balance> {
    return await this.save({
      free,
      reserved,
      miscFrozen,
      feeFrozen,
      accountId,
      blockId,
    });
  }

  public async findByAccountAddress(accountAddress: string): Promise<Balance> {
    return await this.findOne(
      { account: { address: accountAddress } },
      { order: { balanceId: "DESC" } }
    );
  }

  public async replace(
    balanceId: number,
    balanceData: NewBalanceParam
  ): Promise<Balance> {
    return await this.save({
      balanceId,
      ...balanceData,
    });
  }

  public async upsertByAccountAddress(
    accountAddress: string,
    balanceData: NewBalanceParam
  ): Promise<Balance> {
    const existingBalance = await this.findByAccountAddress(accountAddress);

    if (existingBalance) {
      return await this.replace(existingBalance.balanceId, balanceData);
    } else {
      return await this.add(balanceData);
    }
  }
}
