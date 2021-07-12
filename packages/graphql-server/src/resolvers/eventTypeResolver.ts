import { Args, ArgsType, Field, FieldResolver, Int, ObjectType, Query, Resolver, Root } from "type-graphql";
import EventType from "@nodle/db/models/public/eventType";
import { createBaseResolver } from "../baseResolver";
import Module from "@nodle/db/models/public/module";
import { singleFieldResolver } from "../fieldsResolver";

const EventTypeBaseResolver = createBaseResolver("EventType", EventType, "name", "ASC");

@ArgsType()
class EventTypesArgs {
  @Field(() => String, { nullable: true })
  moduleName?: string;

  @Field(() => Int, { nullable: true })
  moduleId?: number;
}

@ObjectType(`EventTypeResponse`)
class EventTypeResponse {
  @Field(() => [EventType])
  items: EventType[];

  @Field(() => Int)
  totalCount: number;
}

@Resolver(EventType)
export default class EventTypeResolver extends EventTypeBaseResolver {
  @Query(() => EventTypeResponse)
  async eventTypes(@Args() { moduleName, moduleId }: EventTypesArgs): Promise<EventTypeResponse> {
    if (moduleName) {
      const module = await Module.findOne({
        name: moduleName,
      });

      moduleId = module.moduleId;
    }

    const items = await EventType.find({
      where: {
        moduleId: moduleId ? moduleId : null,
      },
    });

    return {
      items,
      totalCount: items.length,
    };
  }

  @FieldResolver()
  module(@Root() source: EventType): Promise<Module> {
    return singleFieldResolver(source, Module, "moduleId");
  }
}
