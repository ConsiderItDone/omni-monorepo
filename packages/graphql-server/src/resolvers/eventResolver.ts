import {
  Resolver,
  Query,
  FieldResolver,
  Root,
  Args,
  ArgsType,
  Field,
  Int,
  Arg,
  Subscription,
} from "type-graphql";
import { Min, Max } from "class-validator";
import Event from "@nodle/db/src/models/public/event";
import Block from "@nodle/db/src/models/public/block";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";
import MQ from "@nodle/utils/src/mq";
import { withFilter } from "graphql-subscriptions";

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

@ArgsType()
class SubscribeEventsByNameArgs {
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

  @Query(() => [Event])
  async getEventsByBlockNumber(
    @Arg("number") number: string
  ): Promise<Event[]> {
    const events = await Event.createQueryBuilder("event")
      .leftJoin(Block, "block", "block.blockId = event.blockId")
      .where(`block.number = :number`, { number })
      .getMany();

    return events || [];
  }

  @FieldResolver()
  block(@Root() source: Event): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
  }

  @FieldResolver()
  extrinsic(@Root() source: Event): Promise<Extrinsic> {
    return singleFieldResolver(source, Extrinsic, "extrinsicId");
  }

  @Subscription(() => Event, {
    subscribe: withFilter(
      () => MQ.getMQ().on(`newEvent`),
      (payload, variables) => payload.eventName === variables.eventName
    ),
  })
  newEventByName(
    @Root() entity: Event,
    @Args() args: SubscribeEventsByNameArgs // eslint-disable-line
  ): Event {
    return entity;
  }
}
