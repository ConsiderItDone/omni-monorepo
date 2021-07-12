import { Arg, FieldResolver, Query, Resolver, Root } from "type-graphql";
import Balance from "@nodle/db/models/public/balance";
import Account from "@nodle/db/models/public/account";
import Block from "@nodle/db/models/public/block";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";

const BalanceBaseResolver = createBaseResolver("Balance", Balance);

@Resolver(Balance)
export default class BalanceResolver extends BalanceBaseResolver {
  @Query(() => Balance, { nullable: true })
  async balanceByAddress(@Arg("address") address: string): Promise<Balance> {
    const balance = await Balance.createQueryBuilder("balance")
      .leftJoin(Account, "account", "account.accountId = balance.accountId")
      .leftJoinAndSelect(Block, "block", "block.blockId = balance.blockId")
      .where("balance.blockId is not null")
      .andWhere(`account.address = :address`, { address })
      .addOrderBy("block.number", "DESC")
      .getOne();

    return balance || ({} as any); // eslint-disable-line
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
