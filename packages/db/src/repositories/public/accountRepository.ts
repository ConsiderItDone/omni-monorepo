import { EntityRepository, Repository } from "typeorm";
import { Account } from "../../models";

type NewAccountParam = {
  address: string;
  nonce: number;
  refcount: number;
};

@EntityRepository(Account)
export default class AccountRepository extends Repository<Account> {
  public async add({ address, nonce, refcount }: NewAccountParam): Promise<Account> {
    return await this.save({
      address,
      nonce,
      refcount,
    });
  }

  public async addList(list: NewAccountParam[]): Promise<Account[]> {
    return await this.save(list);
  }

  public async findByAddress(accountAddress: string): Promise<Account> {
    // console.log("findByAddress");
    return await this.findOne({ address: accountAddress });
  }

  public async replace(accountId: number, accountData: NewAccountParam): Promise<Account> {
    // console.log("replace", accountId, accountData);
    return await this.save({
      accountId,
      ...accountData,
    });
  }

  public async upsert(accountAddress: string, accountData: NewAccountParam): Promise<Account> {
    // console.log("upsert");
    const existingAccount = await this.findByAddress(accountAddress);

    if (existingAccount) {
      return await this.replace(existingAccount.accountId, accountData);
    } else {
      return await this.add(accountData);
    }
  }
}
