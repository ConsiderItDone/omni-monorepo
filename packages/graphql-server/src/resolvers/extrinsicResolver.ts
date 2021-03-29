import { Resolver, FieldResolver, Root } from "type-graphql";
import Block from "@nodle/db/src/models/public/block";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import { createBaseResolver } from "../baseResolver";

const ExtrinsicBaseResolver = createBaseResolver("Extrinsic", Extrinsic);

@Resolver(Extrinsic)
export default class ExtrinsicResolver extends ExtrinsicBaseResolver {
  @FieldResolver()
  async block(@Root() extrinsic: Extrinsic): Promise<Block> {
    const block = await Block.findOne(extrinsic.blockId);
    if (!block) {
      return null;
    }

    return block;
  }
}
