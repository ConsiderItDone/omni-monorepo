import { Arg, FieldResolver, Query, Resolver, Root } from "type-graphql";
import Account from "@nodle/db/src/models/public/account";
import Balance from "@nodle/db/src/models/public/balance";
import VestingSchedule from "@nodle/db/src/models/public/vestingSchedule";
import { createBaseResolver } from "../baseResolver";
import { arrayFieldResolver, singleFieldResolver } from "../fieldsResolver";

const AccountBaseResolver = createBaseResolver("Account", Account);

@Resolver(Account)
export default class AccountResolver extends AccountBaseResolver {
  @Query(() => Account)
  async getAccountByAddress(@Arg("address") address: string): Promise<Account> {
    const account = await Account.findOne({
      address,
    });

    if (account === undefined) {
      throw new Error(`Account #${address} not found`);
    }

    return account;
  }

  @FieldResolver()
  balance(@Root() source: Account): Promise<Balance> {
    return singleFieldResolver(source, Balance, "accountId");
  }

  @FieldResolver()
  vestingSchedules(@Root() source: Account): Promise<VestingSchedule[]> {
    return arrayFieldResolver(source, VestingSchedule, "accountId");
  }
}
