import {
  Resolver,
  Query,
  FieldResolver,
  Root,
  Args,
  ArgsType,
  Field,
  Int,
} from "type-graphql";
import { Min, Max } from "class-validator";
import Event from "@nodle/db/src/models/public/event";
import Block from "@nodle/db/src/models/public/block";
import { createBaseResolver } from "../baseResolver";

const EventBaseResolver = createBaseResolver("Event", Event);

@ArgsType()
class GetEventByNameArgs {
  @Field(() => Int, { defaultValue: 0 })
  @Min(0)
  skip: number;

  @Field(() => Int)
  @Min(1)
  @Max(100)
  take = 25;

  @Field(() => String)
  eventName: string;
}

@Resolver(Event)
export default class EventResolver extends EventBaseResolver {
  @Query(() => [Event])
  protected eventsByName(
    @Args() { take, skip, eventName }: GetEventByNameArgs
  ): Promise<Event[]> {
    return Event.find({
      take,
      skip,
      where: {
        eventName,
      },
      order: {
        eventId: "DESC",
      },
    }); // TODO: use repository for real models
  }

  @FieldResolver()
  async block(@Root() event: Event): Promise<Block> {
    const block = await Block.findOne(event.blockId);
    if (!block) {
      return null;
    }

    return block;
  }
}
