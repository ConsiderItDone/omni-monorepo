import {
  Resolver,
  Query,
  Arg,
  FieldResolver,
  Root,
  Subscription,
} from "type-graphql";
import Block from "../models/public/block";
import Extrinsic from "../models/public/extrinsic";
import Event from "../models/public/event";
import MQ from "../mq";

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

  @Subscription(() => Extrinsic, {
    subscribe: () => MQ.getMQ().on("newExtrinsic"),
  })
  newExtrinsic(@Root() extrinsic: Extrinsic): Extrinsic {
    return extrinsic;
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
