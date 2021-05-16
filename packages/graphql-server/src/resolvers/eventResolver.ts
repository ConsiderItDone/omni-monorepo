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
  ObjectType,
} from "type-graphql";
import { Min, Max } from "class-validator";
import Event from "@nodle/db/src/models/public/event";
import Block from "@nodle/db/src/models/public/block";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";
import MQ from "@nodle/utils/src/mq";
import { withFilter } from "graphql-subscriptions";
import { FindManyOptions } from "typeorm";
import EventType from "@nodle/db/dist/src/models/public/eventType";

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

  @Field(() => String, { defaultValue: "All", nullable: true })
  callModule?: string;

  @Field(() => String, { defaultValue: "All", nullable: true })
  eventName?: string;
}

@ArgsType()
class SubscribeEventsByNameArgs {
  @Field(() => String)
  eventName: string;
}

@ObjectType()
class EventsResponse {
  @Field(() => [Event])
  items: Event[];

  @Field(() => Int)
  totalCount: number;
}

@Resolver(Event)
export default class EventResolver extends EventBaseResolver {
  @Query(() => EventsResponse)
  protected async getEvents(
    @Args() { take, skip, callModule, eventName }: GetEventByNameArgs
  ): Promise<EventsResponse> {
    const findOptions: FindManyOptions<Event> = {
      take,
      skip,
      order: {
        eventId: "DESC",
      },
    };

    let result;

    let type: EventType;
    if (eventName !== "All") {
      type = await EventType.findOne({
        name: eventName,
      });
    }

    if (callModule === "All" && eventName === "All") {
      result = await Event.findAndCount(findOptions);
    } else if (eventName === "All") {
      result = await Event.findAndCount({
        ...findOptions,
        where: {
          moduleName: callModule,
        },
      });
    } else if (callModule === "All") {
      result = await Event.findAndCount({
        ...findOptions,
        where: {
          eventTypeId: type.eventTypeId,
        },
      });
    } else {
      result = await Event.findAndCount({
        ...findOptions,
        where: {
          moduleName: callModule,
          eventTypeId: type.eventTypeId,
        },
      });
    }
    return { items: result[0], totalCount: result[1] };
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
      (payload, variables) => payload.eventTypeId === variables.eventTypeId
    ),
  })
  newEventByName(
    @Root() entity: Event,
    @Args() args: SubscribeEventsByNameArgs // eslint-disable-line
  ): Event {
    return entity;
  }
}
