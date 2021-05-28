import { Arg, FieldResolver, Query, Resolver, Root } from "type-graphql";
import Balance from "@nodle/db/src/models/public/balance";
import Account from "@nodle/db/src/models/public/account";
import Block from "@nodle/db/src/models/public/block";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";

const BalanceBaseResolver = createBaseResolver("Balance", Balance);

@Resolver(Balance)
export default class BalanceResolver extends BalanceBaseResolver {
  @Query(() => Balance, { nullable: true })
  async balanceByAddress(@Arg("address") address: string): Promise<Balance> {
    const account = await Account.findOne({
      where: {
        address,
      },
      relations: ["balance"],
    });

    return account?.balance;
  }

  @FieldResolver()
  account(@Root() source: Balance): Promise<Account> {
    return singleFieldResolver<Balance>(source, Account, "accountId");
  }

  @FieldResolver()
  block(@Root() source: Balance): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
  }
}
