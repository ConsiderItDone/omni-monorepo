import { Resolver, FieldResolver, Root } from "type-graphql";
import Block from "@nodle/db/src/models/public/block";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import Event from "@nodle/db/src/models/public/event";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";

const ExtrinsicBaseResolver = createBaseResolver("Extrinsic", Extrinsic);

@Resolver(Extrinsic)
export default class ExtrinsicResolver extends ExtrinsicBaseResolver {
  @FieldResolver()
  block(@Root() source: Extrinsic): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
  }

  @FieldResolver()
  events(@Root() source: Extrinsic): Promise<Event[]> {
    return singleFieldResolver(source, Event, "eventId");
  }
}
