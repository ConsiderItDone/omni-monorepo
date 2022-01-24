import { FieldResolver, Resolver, Root } from "type-graphql";
import { VestingSchedule, Block, Account } from "@nodle/db/index";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";

const VestingScheduleBaseResolver = createBaseResolver("VestingSchedule", VestingSchedule);

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
