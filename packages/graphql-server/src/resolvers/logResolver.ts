import { Resolver, FieldResolver, Root, Query, Arg } from "type-graphql";
import { Log, Block } from "@nodle/db";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";

const LogBaseResolver = createBaseResolver("Log", Log);

@Resolver(Log)
export default class LogResolver extends LogBaseResolver {
  @Query(() => [Log])
  async logsByBlockNumber(@Arg("number") number: string): Promise<Log[]> {
    const logs = await Log.createQueryBuilder("log")
      .leftJoin(Block, "block", "block.blockId = log.blockId")
      .where(`block.number = :number`, { number })
      .getMany();

    return logs || [];
  }

  @FieldResolver()
  block(@Root() source: Log): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
  }
}
