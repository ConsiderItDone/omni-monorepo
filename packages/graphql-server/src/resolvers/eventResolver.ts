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
import { getConnection, ILike } from "typeorm";
import EventType from "@nodle/db/src/models/public/eventType";
import { GraphQLJSON } from "graphql-type-json";
import Module from "@nodle/db/src/models/public/module";

const EventBaseResolver = createBaseResolver("Event", Event);

@ArgsType()
class EventByNameArgs {
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
  extrinsicHash?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  filters?: any; // eslint-disable-line

  @Field(() => Date, { nullable: true })
  dateStart?: Date;

  @Field(() => Date, { nullable: true })
  dateEnd?: Date;
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
  protected async events(
    @Args() { take, skip, callModule, eventName, extrinsicHash, filters, dateStart, dateEnd }: EventByNameArgs
  ): Promise<EventsResponse> {
    const query = Event.createQueryBuilder("event").take(take).skip(skip).orderBy("event.eventId", "DESC");

    if (extrinsicHash) {
      query.andWhere(`event.extrinsic_hash = '${extrinsicHash}'`);
    }

    if (filters) {
      Object.keys(filters).forEach((filter) => {
        query.andWhere(`event.data @> '{"${filter}":"${filters[filter]}"}'`);
      });
    }

    if (dateStart || dateEnd) {
      query.leftJoin(Block, "block", "block.block_id = event.block_id");

      if (dateStart) {
        query.andWhere(`block.timestamp > '${dateStart.toUTCString()}'::timestamp`);
      }
      if (dateEnd) {
        query.andWhere(`block.timestamp < '${dateEnd.toUTCString()}'::timestamp`);
      }
    }

    if (callModule && callModule !== "All") {
      const module = await Module.findOne({
        name: ILike(callModule),
      });

      if (!module) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      query.andWhere(`event.module_id = ${module.moduleId}`);

      if (eventName && eventName !== "All") {
        const type = await EventType.findOne({
          name: ILike(eventName),
          moduleId: module.moduleId,
        });

        if (!type) {
          return {
            items: [],
            totalCount: 0,
          };
        }

        query.andWhere(`event.event_type_id = ${type.eventTypeId}`);
      }
    }

    const result = await query.getManyAndCount();
    return { items: result[0], totalCount: result[1] };
  }

  @Query(() => [Event])
  async eventsByBlockNumber(@Arg("number") number: string): Promise<Event[]> {
    const events = await Event.createQueryBuilder("event")
      .leftJoin(Block, "block", "block.blockId = event.blockId")
      .where(`block.number = :number`, { number })
      .getMany();

    return events || [];
  }

  @Query(() => [TransferChartData])
  async transfersChartData(): Promise<TransferChartData[]> {
    const eventType = await EventType.findOne({
      name: "Transfer",
    });

    if (!eventType) {
      return [];
    }

    const data = await getConnection().query(`
      select
        date_trunc('day', b."timestamp") as date,
        count(1) as quantity,
        sum(
          CEIL(CAST((e."data"->0)->>'amount' as BIGINT) / 10^12)
        ) as amount
      from public."event" e 
      left join public.block b on b.block_id = e.block_id 
      where e.event_type_id = ${eventType.eventTypeId}
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
  eventType(@Root() source: Event): Promise<EventType> {
    return singleFieldResolver(source, EventType, "eventTypeId");
  }

  @FieldResolver()
  module(@Root() source: Event): Promise<Module> {
    return singleFieldResolver(source, Module, "moduleId");
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
