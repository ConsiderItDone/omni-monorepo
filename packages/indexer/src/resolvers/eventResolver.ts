import {Resolver, Query, Arg, FieldResolver, Root} from "type-graphql";
import Event from "../models/public/event";
import Block from "../models/public/block";

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

  @FieldResolver()
  async block(@Root() event: Event) {
    const block = await Block.findOne(event.blockId);
    if (!block) {
      return null;
    }

    return block;
  }
}
