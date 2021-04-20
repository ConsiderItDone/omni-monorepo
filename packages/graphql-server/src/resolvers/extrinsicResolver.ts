import { Resolver, FieldResolver, Root, Query, Arg } from "type-graphql";
import Block from "@nodle/db/src/models/public/block";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import Event from "@nodle/db/src/models/public/event";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver, arrayFieldResolver } from "../fieldsResolver";

const ExtrinsicBaseResolver = createBaseResolver("Extrinsic", Extrinsic);

@Resolver(Extrinsic)
export default class ExtrinsicResolver extends ExtrinsicBaseResolver {
  @Query(() => [Extrinsic])
  async getExtrinsicsByBlockNumber(
    @Arg("number") number: string
  ): Promise<Extrinsic[]> {
    const extrinsics = await Extrinsic.createQueryBuilder("log")
      .leftJoin(Block, "block", "block.blockId = log.blockId")
      .where(`block.number = :number`, { number })
      .getMany();

    return extrinsics || [];
  }

  @FieldResolver()
  block(@Root() source: Extrinsic): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
  }

  @FieldResolver()
  events(@Root() source: Extrinsic): Promise<Event[]> {
    return arrayFieldResolver(source, Event, "extrinsicId");
  }
}
