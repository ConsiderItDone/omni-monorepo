import { FieldResolver, Resolver, Root } from "type-graphql";
import Module from "@nodle/db/src/models/public/module";
import { createBaseResolver } from "../baseResolver";
import { arrayFieldResolver } from "../fieldsResolver";
import EventType from "@nodle/db/src/models/public/eventType";

const ModuleBaseResolver = createBaseResolver("Module", Module);

@Resolver(Module)
export default class ModuleResolver extends ModuleBaseResolver {
  @FieldResolver()
  eventTypes(@Root() source: Module): Promise<EventType[]> {
    return arrayFieldResolver(source, EventType, "moduleId");
  }
}
