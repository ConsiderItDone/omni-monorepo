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
    return await this.findOne(
      { address: accountAddress },
      {
        order: { accountId: "ASC" },
      }
    );
  }

  public async replace(accountId: number, accountData: NewAccountParam): Promise<Account> {
    // console.log("replace", accountId, accountData);
    return await this.save({
      accountId,
      ...accountData,
    });
  }
  //eslint-disable-next-line
  //@ts-ignore
  public async upsert(accountId: number, accountData: NewAccountParam): Promise<Account> {
    if (accountId) {
      return await this.replace(accountId, accountData);
    } else {
      //temp fix, TODO: FIX on upper level
      const savedAccount = await this.findByAddress(accountData.address);
      if (savedAccount) return await this.replace(savedAccount.accountId, accountData);
      return await this.add(accountData);
    }
  }
}
