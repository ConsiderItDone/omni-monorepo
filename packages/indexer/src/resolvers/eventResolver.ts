import {
  Resolver,
  Query,
  Arg,
  FieldResolver,
  Root,
  Subscription,
} from "type-graphql";
import Event from "../models/public/event";
import Block from "../models/public/block";
import MQ from "../mq";

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
  protected events() {
    return Event.find(); // TODO: use repository for real models
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
