import { Resolver, Query, Arg, FieldResolver, Root } from "type-graphql";
import Log from "../models/public/log";
import Block from "../models/public/block";

@Resolver(Log)
export default class LogResolver {
  @Query(() => Log)
  async log(@Arg("id") id: number) {
    const log = await Log.findOne(id);
    if (log === undefined) {
      throw new Error(`Log ${id} not found`);
    }

    return log;
  }

  @Query(() => [Log])
  protected logs() {
    return Log.find(); // TODO: use repository for real models
  }

  @FieldResolver()
  async block(@Root() log: Log) {
    const block = await Block.findOne(log.blockId);
    if (!block) {
      return null;
    }

    return block;
  }
}
