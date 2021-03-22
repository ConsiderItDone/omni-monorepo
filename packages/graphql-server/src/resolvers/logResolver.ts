import {
  Resolver,
  Query,
  Arg,
  FieldResolver,
  Root,
  Subscription,
} from "type-graphql";
import Log from "../models/public/log";
import Block from "../models/public/block";
import MQ from "@nodle/indexer/dist/src/mq";

@Resolver(Log)
export default class LogResolver {
  @Query(() => Log)
  async log(@Arg("id") id: number): Promise<Log> {
    const log = await Log.findOne(id);
    if (log === undefined) {
      throw new Error(`Log ${id} not found`);
    }

    return log;
  }

  @Query(() => [Log])
  protected logs(): Promise<Log[]> {
    return Log.find(); // TODO: use repository for real models
  }

  @Subscription(() => Log, {
    subscribe: () => MQ.getMQ().on("newLog"),
  })
  newLog(@Root() log: Log): Log {
    return log;
  }

  @FieldResolver()
  async block(@Root() log: Log): Promise<Block> {
    const block = await Block.findOne(log.blockId);
    if (!block) {
      return null;
    }

    return block;
  }
}
