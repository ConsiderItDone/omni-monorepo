import { Arg, Args, ArgsType, Field, FieldResolver, Query, Resolver, Root, Subscription } from "type-graphql";
import Balance from "@nodle/db/src/models/public/balance";
import Account from "@nodle/db/src/models/public/account";
import Block from "@nodle/db/src/models/public/block";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";
import { cacheService } from "@nodle/utils/src/services/cacheService";
import { withFilter } from "graphql-subscriptions";
import MQ from "@nodle/utils/src/mq";
import { getConnection } from "typeorm";
import BalanceRepository from "@nodle/db/src/repositories/public/balanceRepository";

const BalanceBaseResolver = createBaseResolver("Balance", Balance);

@ArgsType()
class SubscribeBalanceByAddress {
  @Field(() => String)
  address: string;
}

@Resolver(Balance)
export default class BalanceResolver extends BalanceBaseResolver {
  @Query(() => Balance, { nullable: true })
  async balanceByAddress(@Arg("address") address: string): Promise<Balance> {
    const cachedBalance = await cacheService.get(address).then(JSON.parse);

    if (cachedBalance) {
      console.log(`Found balance in cache by key: ${address} `);
      return cachedBalance;
    }

    const balanceRepository = getConnection().getCustomRepository(BalanceRepository);

    const balance = await balanceRepository.getBalanceByAddress(address);

    if (balance) {
      cacheService.set(address, balance);
    }

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
