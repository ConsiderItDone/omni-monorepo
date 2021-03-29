import { Resolver, FieldResolver, Root } from "type-graphql";
import Log from "@nodle/db/src/models/public/log";
import Block from "@nodle/db/src/models/public/block";
import { createBaseResolver } from "../baseResolver";

const LogBaseResolver = createBaseResolver("Log", Log);

@Resolver(Log)
export default class LogResolver extends LogBaseResolver {
  @FieldResolver()
  async block(@Root() log: Log): Promise<Block> {
    const block = await Block.findOne(log.blockId);
    if (!block) {
      return null;
    }

    return block;
  }
}
