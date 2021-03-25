import { EntityRepository, Repository } from "typeorm";
import { Account } from "../../models";

type NewAccountParam = {
  accountId: number;
  address: string;
  nonce: number;
  refcount: number;
  balance: number;
};

@EntityRepository(Account)
export default class AccountRepository extends Repository<Account> {
  public async add({
    accountId,
    address,
    nonce,
    refcount,
    balance,
  }: NewAccountParam): Promise<Account> {
    return await this.save({
      accountId,
      address,
      nonce,
      refcount,
      balance,
    });
  }

  public async addList(list: NewAccountParam[]): Promise<Account[]> {
    return await this.save(list);
  }
}
