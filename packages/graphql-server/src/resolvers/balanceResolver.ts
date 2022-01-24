import { Balance, Account, Block } from "@nodle/db/index";
import { Arg, Args, ArgsType, Field, FieldResolver, Query, Resolver, Root, Subscription } from "type-graphql";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";
import { services } from "@nodle/utils/index";
const BalanceService = services.BalanceService;
import { withFilter } from "graphql-subscriptions";
import { MQ } from "@nodle/utils/index";

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
