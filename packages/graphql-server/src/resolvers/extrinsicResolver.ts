import {
  Resolver,
  Query,
  Arg,
  FieldResolver,
  Root,
  Subscription,
} from "type-graphql";
import Block from "@nodle/db/models/public/block";
import Extrinsic from "@nodle/db/models/public/extrinsic";
import MQ from "../../mq";

@Resolver(Extrinsic)
export default class ExtrinsicResolver {
  @Query(() => Extrinsic)
  async extrinsic(@Arg("id") id: number): Promise<Extrinsic> {
    const extrinsic = await Extrinsic.findOne(id);
    if (extrinsic === undefined) {
      throw new Error(`Extrinsic ${id} not found`);
    }

    return extrinsic;
  }

  @Query(() => [Extrinsic])
  protected extrinsics(): Promise<Extrinsic[]> {
    return Extrinsic.find(); // TODO: use repository for real models
  }

  @Subscription(() => Extrinsic, {
    subscribe: () => MQ.getMQ().on("newExtrinsic"),
  })
  newExtrinsic(@Root() extrinsic: Extrinsic): Extrinsic {
    return extrinsic;
  }

  @FieldResolver()
  async block(@Root() extrinsic: Extrinsic): Promise<Block> {
    const block = await Block.findOne(extrinsic.blockId);
    if (!block) {
      return null;
    }

    return block;
  }
}
