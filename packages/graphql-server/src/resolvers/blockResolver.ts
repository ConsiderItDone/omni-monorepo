import {
  Resolver,
  Query,
  Arg,
  FieldResolver,
  Root,
  ArgsType,
  Field,
  Int,
  Args,
  Subscription,
} from "type-graphql";
import { Min, Max } from "class-validator";
import Block from "@nodle/db/src/models/public/block";
import Event from "@nodle/db/src/models/public/event";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import MQ from "../../../utils/src/mq";

@ArgsType()
class GetBlocksArgs {
  @Field(() => Int, { defaultValue: 0 })
  @Min(0)
  skip: number;

  @Field(() => Int)
  @Min(1)
  @Max(100)
  take = 25;
}

@Resolver(Block)
export default class BlockResolver {
  @Query(() => Block)
  async block(@Arg("id") id: number): Promise<Block> {
    const block = await Block.findOne(id);
    if (block === undefined) {
      throw new Error(`Block ${id} not found`);
    }

    return block;
  }

  @Query(() => [Block])
  protected blocks(@Args() { take, skip }: GetBlocksArgs): Promise<Block[]> {
    return Block.find({
      take,
      skip,
      order: {
        blockId: "DESC",
      },
    }); // TODO: use repository for real models
  }

  @Subscription(() => Block, {
    subscribe: () => MQ.getMQ().on("newBlock"),
  })
  newBlock(@Root() block: Block): Block {
    return block;
  }

  @FieldResolver()
  async events(@Root() block: Block): Promise<Event[]> {
    const events = await Event.find({
      where: {
        blockId: block.blockId,
      },
    });
    if (!events) {
      return [];
    }

    return events;
  }

  @FieldResolver()
  async extrinsics(@Root() block: Block): Promise<Extrinsic[]> {
    const extrinsic = await Extrinsic.find({
      where: {
        blockId: block.blockId,
      },
    });
    if (!extrinsic) {
      return [];
    }

    return extrinsic;
  }
}
