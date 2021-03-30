import { Resolver, FieldResolver, Root } from "type-graphql";
import Log from "@nodle/db/src/models/public/log";
import Block from "@nodle/db/src/models/public/block";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";

const LogBaseResolver = createBaseResolver("Log", Log);

@Resolver(Log)
export default class LogResolver extends LogBaseResolver {
  @FieldResolver()
  block(@Root() source: Log): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
  }
}
