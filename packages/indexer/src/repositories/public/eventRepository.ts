import { EntityRepository, Repository } from "typeorm";
import Block from "../../models/public/block";
import Event from "../../models/public/event";

@EntityRepository(Event)
export default class EventRepository extends Repository<Event> {
  public add({
    index,
    type,
    extrinsicHash,
    moduleName,
    eventName,
    block,
  }: {
    index: number,
    type: string,
    extrinsicHash: string | null,
    moduleName: string,
    eventName: string,
    block: Block,
  }) {
    return this.save({
      index,
      type,
      extrinsicHash,
      moduleName,
      eventName,
      block,
    });
  }
}