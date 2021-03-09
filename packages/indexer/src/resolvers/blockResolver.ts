import {Resolver, Query, Arg, FieldResolver, Root} from "type-graphql";
import Block from "../models/public/block";
import Event from "../models/public/event";

@Resolver(Block)
export default class BlockResolver {

  @Query(() => Block)
  async block(@Arg("id") id: number) {
    const block = await Block.findOne(id);
    if (block === undefined) {
      throw new Error(`Block ${id} not found`);
    }

    return block;
  }

  @Query(() => [Block])
  protected blocks() {
    return Block.find(); // TODO: use repository for real models
  }

  @FieldResolver()
  async events(@Root() block: Block) {
    const events = await Event.find({
      where: {
        blockId: block.blockId,
      }
    });
    if (!events) {
      return [];
    }

    return events;
  }

}
