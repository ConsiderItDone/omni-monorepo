import { Resolver, Query, Arg, FieldResolver, Root } from "type-graphql";
import Block from "@nodle/db/src/models/public/block";
import Event from "@nodle/db/src/models/public/event";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import { createBaseResolver } from "../baseResolver";

const BlockBaseResolver = createBaseResolver("Block", Block);

@Resolver(Block)
export default class BlockResolver extends BlockBaseResolver {
  @Query(() => Block)
  async getBlockByBlockNumber(@Arg("number") number: string): Promise<Block> {
    const block = await Block.findOne({
      number,
    });

    if (block === undefined) {
      throw new Error(`Block #${number} not found`);
    }

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
