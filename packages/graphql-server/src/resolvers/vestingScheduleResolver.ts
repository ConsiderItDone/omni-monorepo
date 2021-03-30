import { FieldResolver, Resolver, Root } from "type-graphql";
import VestingSchedule from "@nodle/db/src/models/public/vestingSchedule";
import Block from "@nodle/db/src/models/public/block";
import Account from "@nodle/db/src/models/public/account";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";

const VestingScheduleBaseResolver = createBaseResolver(
  "VestingSchedule",
  VestingSchedule
);

@Resolver(VestingSchedule)
export default class VestingScheduleResolver extends VestingScheduleBaseResolver {
  @FieldResolver()
  block(@Root() source: VestingSchedule): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
  }

  @FieldResolver()
  account(@Root() source: VestingSchedule): Promise<Account> {
    return singleFieldResolver(source, Account, "accountId");
  }
}
