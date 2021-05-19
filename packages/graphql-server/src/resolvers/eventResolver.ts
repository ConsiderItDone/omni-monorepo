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
import { FindConditions, FindManyOptions, getConnection, Raw } from "typeorm";
import EventType from "@nodle/db/src/models/public/eventType";

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

  @Field(() => String, { nullable: true })
  from?: string;

  @Field(() => String, { nullable: true })
  to?: string;
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

@ObjectType()
class TransferChartData {
  @Field(() => Date)
  date: Date;

  @Field(() => Int, { defaultValue: 0 })
  quantity: number;

  @Field(() => Int, { defaultValue: 0 })
  amount: number;
}

@Resolver(Event)
export default class EventResolver extends EventBaseResolver {
  @Query(() => EventsResponse)
  protected async getEvents(
    @Args() { take, skip, callModule, eventName, from, to }: GetEventByNameArgs
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

    const where: FindConditions<Event> = {};
    if (from && to) {
      where.data = Raw(
        (data) =>
          `${data} @> '[{"from":"${from}"}]' and ${data} @> '[{"to":"${to}"}]'`
      );
    } else if (from) {
      where.data = Raw((data) => `${data} @> '[{"from":"${from}"}]'`);
    } else if (to) {
      where.data = Raw((data) => `${data} @> '[{"to":"${to}"}]'`);
    }

    if (callModule === "All" && eventName === "All") {
      result = await Event.findAndCount({
        ...findOptions,
        where,
      });
    } else if (eventName === "All") {
      result = await Event.findAndCount({
        ...findOptions,
        where: {
          ...where,
          moduleName: callModule,
        },
      });
    } else if (callModule === "All") {
      result = await Event.findAndCount({
        ...findOptions,
        where: {
          ...where,
          eventTypeId: type ? type.eventTypeId : null,
        },
      });
    } else {
      result = await Event.findAndCount({
        ...findOptions,
        where: {
          ...where,
          moduleName: callModule,
          eventTypeId: type ? type.eventTypeId : null,
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

  @Query(() => [TransferChartData])
  async getTransfersChartData(): Promise<TransferChartData[]> {
    const eventType = await EventType.findOne({
      name: "Transfer",
    });

    if (!eventType) {
      return [];
    }

    const data = await getConnection().query(`
      select
        date_trunc('hour', b."timestamp") as date,
        count(1) as quantity,
        sum(
          CEIL(CAST((e."data"->0)->>'amount' as BIGINT) / 10^12)
        ) as amount
      from public."event" e 
      left join public.block b on b.block_id = e.block_id 
      where e.event_type_id = 14
      group by 1
    `);

    return data || [];
  }

  @FieldResolver()
  block(@Root() source: Event): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
  }

  @FieldResolver()
  extrinsic(@Root() source: Event): Promise<Extrinsic> {
    return singleFieldResolver(source, Extrinsic, "extrinsicId");
  }

  @FieldResolver()
  eventType(@Root() source: Extrinsic): Promise<EventType> {
    return singleFieldResolver(source, EventType, "eventTypeId");
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
