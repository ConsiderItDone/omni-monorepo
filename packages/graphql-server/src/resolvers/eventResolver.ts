/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
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
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";
import { MQ } from "@nodle/utils";
import { withFilter } from "graphql-subscriptions";
import { getConnection, ILike } from "typeorm";
import { GraphQLJSON } from "graphql-type-json";
// import { cacheService } from "@nodle/utils/src/services/cacheService";
import { EventRepository, Module, EventType, Event, Block, Extrinsic } from "@nodle/db";
import DataLoader from "dataloader";
import { Loader } from "type-graphql-dataloader";
import { groupBy } from "lodash";

const EventBaseResolver = createBaseResolver("Event", Event);

function groupByEventId<T>(items: T[]) {
  const newItems = [];
  for (const item of items) {
    // eslint-disable-next-line
    for (const event of (item as any).events) {
      newItems.push(({
        eventId: event.eventId,
        ...item,
      } as any) as T); // eslint-disable-line
    }
  }

  return groupBy(newItems, "eventId");
}

@ArgsType()
class EventByNameArgs {
  @Field(() => Int, { defaultValue: 0 })
  @Min(0)
  skip: number;

  @Field(() => Int, { defaultValue: 25 })
  @Min(1)
  @Max(100)
  take?: number;

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
    let cacheKey = "";

    let moduleId = 0;
    let eventTypeId = 0;

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

      moduleId = module.moduleId;

      cacheKey += `-${module.moduleId}`;

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
        cacheKey += `-${type.eventTypeId}`;

        eventTypeId = type.eventTypeId;
      }
    }

    if (filters) {
      cacheKey += `-${JSON.stringify(filters)}`;
    }

    if (dateStart || dateEnd) {
      cacheKey += `-${dateStart?.getTime()}-${dateEnd?.getTime()}`;
    }

    if (extrinsicHash) {
      cacheKey += "extrinsicHash";
    }

    if (cacheKey !== "") {
      // cacheKey = `events${cacheKey}-${take}-${skip}`;
      // console.time("events from cache");
      // const cachedValue = await cacheService.get(cacheKey).then(JSON.parse);
      // console.timeEnd("events from cache");
      // if (cachedValue) {
      //   console.log(`Found events in cache by key: ${cacheKey}`);
      //   return { items: cachedValue[0], totalCount: cachedValue[1] };
      // }
    }

    const eventRepository = getConnection().getCustomRepository(EventRepository);

    console.time("events");
    const events = await eventRepository.findByParams(
      moduleId,
      eventTypeId,
      filters,
      dateStart,
      dateEnd,
      extrinsicHash,
      skip,
      take
    );
    console.timeEnd("events");
    console.time("event count");
    const count = await eventRepository.countByParams(
      moduleId,
      eventTypeId,
      filters,
      dateStart,
      dateEnd,
      extrinsicHash
    );
    console.timeEnd("event count");

    // if (cacheKey !== "" && events) {
    //   cacheService.set(cacheKey, [events, count]);
    // }

    return { items: events, totalCount: count };
  }

  @Query(() => [Event])
  async eventsByBlockNumber(@Arg("number") number: string): Promise<Event[]> {
    const events = await Event.createQueryBuilder("event")
      .leftJoin(Block, "block", "block.blockId = event.blockId")
      .where(`block.number = :number`, { number })
      .getMany();

    return events || [];
  }

  @Query(() => EventsResponse)
  async eventsByIndex(
    @Arg("blockNumber") number: number,
    @Arg("extrinsicIndex") extrinsicIndex: number,
    @Arg("eventIndex") eventIndex: number
  ): Promise<EventsResponse> {
    const query = await Event.createQueryBuilder("event")
      .leftJoin(Block, "block", "block.blockId = event.blockId")
      .leftJoin(Extrinsic, "extrinsic", "extrinsic.extrinsicId = event.extrinsicId")
      .where(`block.number = :number`, { number })
      .andWhere(`extrinsic.index = :extrinsicIndex`, { extrinsicIndex })
      .andWhere(`event.index = :eventIndex`, { eventIndex });

    const result = await query.getManyAndCount();
    return { items: result[0], totalCount: result[1] };
  }

  @Query(() => [TransferChartData])
  async transfersChartData(): Promise<TransferChartData[]> {
    const eventType = await EventType.findOne({
      name: "Transfer",
    });

    if (!eventType) {
      return [];
    }

    const eventRepository = getConnection().getCustomRepository(EventRepository);

    const data = await eventRepository.getStats(eventType.eventTypeId);

    return data || [];
  }

  @FieldResolver()
  @Loader<number, Block>(async (eventIds) => {
    const blocks = await Block.createQueryBuilder("block")
      .leftJoinAndSelect("block.events", "events")
      .where(`events.eventId IN(:...eventIds)`, { eventIds })
      .getMany();

    const itemsByEventId = groupByEventId<Block>(blocks);
    return eventIds.map((id) => itemsByEventId[id][0] ?? null);
  })
  block(@Root() source: Event) {
    return (dataloader: DataLoader<number, Block>) => dataloader.load(source.eventId);
  }

  @FieldResolver()
  @Loader<number, Extrinsic>(async (eventIds) => {
    const items = await Extrinsic.createQueryBuilder("item")
      .leftJoinAndSelect("item.events", "events")
      .where(`events.eventId IN(:...eventIds)`, { eventIds })
      .getMany();

    const itemsByEventId = groupByEventId<Extrinsic>(items);
    return eventIds.map((id) => itemsByEventId[id][0] ?? null);
  })
  extrinsic(@Root() source: Event) {
    return (dataloader: DataLoader<number, Extrinsic>) => dataloader.load(source.eventId);
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
      async (payload, variables) => {
        const { eventTypeId } = await EventType.findOne({ where: { name: variables.eventName } });
        return payload.eventTypeId === eventTypeId;
      }
    ),
  })
  newEventByName(
    @Root() entity: Event,
    @Args() args: SubscribeEventsByNameArgs // eslint-disable-line
  ): Event {
    return entity;
  }
}
