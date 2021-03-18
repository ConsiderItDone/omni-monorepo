import {
  Resolver,
  Query,
  Arg,
  FieldResolver,
  Root,
  Subscription, Args, ArgsType, Field, Int,
} from "type-graphql";
import { Min, Max } from "class-validator";
import Event from "../models/public/event";
import Block from "../models/public/block";
import MQ from "../mq";

@ArgsType()
class GetEventArgs {
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
export default class EventResolver {
  @Query(() => Event)
  async event(@Arg("id") id: number) {
    const block = await Event.findOne(id);
    if (block === undefined) {
      throw new Error(`Block ${id} not found`);
    }

    return block;
  }

  @Query(() => [Event])
  protected events(@Args() { take, skip, eventName }: GetEventArgs) {
    return Event.find({
      take,
      skip,
      where: {
        eventName,
      },
      order: {
        eventId: "DESC"
      },
    }); // TODO: use repository for real models
  }

  @Subscription(() => Event, {
    subscribe: () => MQ.getMQ().on("newEvent"),
  })
  newEvent(@Root() event: Event): Event {
    return event;
  }

  @FieldResolver()
  async block(@Root() event: Event) {
    const block = await Block.findOne(event.blockId);
    if (!block) {
      return null;
    }

    return block;
  }
}
