import { FieldResolver, Resolver, Root } from "type-graphql";
import { Module, EventType, ExtrinsicType } from "@nodle/db/index";
import { createBaseResolver } from "../baseResolver";
import { arrayFieldResolver } from "../fieldsResolver";

const ModuleBaseResolver = createBaseResolver("Module", Module, "name", "ASC");

@Resolver(Module)
export default class ModuleResolver extends ModuleBaseResolver {
  @FieldResolver()
  eventTypes(@Root() source: Module): Promise<EventType[]> {
    return arrayFieldResolver(
      source,
      EventType,
      "moduleId",
      null,
      {},
      {
        name: "ASC",
      }
    );
  }

  @FieldResolver()
  extrinsicTypes(@Root() source: Module): Promise<ExtrinsicType[]> {
    return arrayFieldResolver(
      source,
      ExtrinsicType,
      "moduleId",
      null,
      {},
      {
        name: "ASC",
      }
    );
  }
}
