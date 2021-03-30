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
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";

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
  block(@Root() source: Event): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
  }

  @FieldResolver()
  extrinsic(@Root() source: Event): Promise<Extrinsic> {
    return singleFieldResolver(source, Extrinsic, "blockId");
  }
}
