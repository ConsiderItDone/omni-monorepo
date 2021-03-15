import { Resolver, Query, Arg, FieldResolver, Root } from "type-graphql";
import Block from "../models/public/block";
import Extrinsic from "../models/public/extrinsic";

@Resolver(Extrinsic)
export default class ExtrinsicResolver {
  @Query(() => Extrinsic)
  async extrinsic(@Arg("id") id: number) {
    const extrinsic = await Extrinsic.findOne(id);
    if (extrinsic === undefined) {
      throw new Error(`Extrinsic ${id} not found`);
    }

    return extrinsic;
  }

  @Query(() => [Extrinsic])
  protected extrinsics() {
    return Extrinsic.find(); // TODO: use repository for real models
  }

  @FieldResolver()
  async block(@Root() extrinsic: Extrinsic) {
    const block = await Block.findOne(extrinsic.blockId);
    if (!block) {
      return null;
    }

    return block;
  }
}
