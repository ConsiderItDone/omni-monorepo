import Balance from "@nodle/db/models/public/balance";
import Account from "@nodle/db/models/public/account";
import Block from "@nodle/db/models/public/block";
import { Arg, Args, ArgsType, Field, FieldResolver, Query, Resolver, Root, Subscription } from "type-graphql";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";
import { BalanceService } from "@nodle/utils/services/balanceService";
import { withFilter } from "graphql-subscriptions";
import MQ from "@nodle/utils/mq";

const BalanceBaseResolver = createBaseResolver("Balance", Balance);

@ArgsType()
class SubscribeBalanceByAddress {
  @Field(() => String)
  address: string;
}

@Resolver(Balance)
export default class BalanceResolver extends BalanceBaseResolver {
  @Query(() => Balance, { nullable: true })
  balanceByAddress(@Arg("address") address: string): Promise<Balance> {
    const balanceService = new BalanceService();

    return balanceService.getBalanceByAddress(address);
  }

  @FieldResolver()
  account(@Root() source: Balance): Promise<Account> {
    return singleFieldResolver<Balance>(source, Account, "accountId");
  }

  @FieldResolver()
  block(@Root() source: Balance): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
  }

  @Subscription(() => Balance, {
    subscribe: withFilter(
      () => MQ.getMQ().on(`newBalance`),
      (payload, variables) => {
        const match = payload.address === variables.address;
        delete payload.address;
        return match;
      }
    ),
  })
  newBalanceByAddress(
    @Root() entity: Balance,
    @Args() args: SubscribeBalanceByAddress // eslint-disable-line
  ): Balance {
    return entity;
  }
}
