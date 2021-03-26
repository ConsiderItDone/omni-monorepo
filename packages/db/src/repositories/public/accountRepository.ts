import { EntityRepository, Repository } from "typeorm";
import { Account } from "../../models";

type NewAccountParam = {
  address: string;
  nonce: number;
  refcount: number;
};

@EntityRepository(Account)
export default class AccountRepository extends Repository<Account> {
  public async add({
    address,
    nonce,
    refcount,
  }: NewAccountParam): Promise<Account> {
    return await this.save({
      address,
      nonce,
      refcount,
    });
  }

  public async addList(list: NewAccountParam[]): Promise<Account[]> {
    return await this.save(list);
  }
}
