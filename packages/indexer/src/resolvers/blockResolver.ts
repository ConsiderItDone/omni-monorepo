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
} from "type-graphql";
import { Min, Max } from "class-validator";
import Block from "../models/public/block";
import Event from "../models/public/event";

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
  async block(@Arg("id") id: number) {
    const block = await Block.findOne(id);
    if (block === undefined) {
      throw new Error(`Block ${id} not found`);
    }

    return block;
  }

  @Query(() => [Block])
  protected blocks(@Args() { take, skip }: GetBlocksArgs) {
    return Block.find({
      take,
      skip,
      order: {
        blockId: "ASC",
      },
    }); // TODO: use repository for real models
  }

  @FieldResolver()
  async events(@Root() block: Block) {
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
}
