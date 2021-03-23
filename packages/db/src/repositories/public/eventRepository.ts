import { EntityRepository, Repository } from "typeorm";
import Event from "../../models/public/event";

@EntityRepository(Event)
export default class EventRepository extends Repository<Event> {
  public async add({
    index,
    type,
    extrinsicHash,
    moduleName,
    eventName,
    blockId,
  }: {
    index: number;
    type: string;
    extrinsicHash: string | null;
    moduleName: string;
    eventName: string;
    blockId: number;
  }): Promise<Event> {
    const event = await this.save({
      index,
      type,
      extrinsicHash,
      moduleName,
      eventName,
      blockId,
    });

    return event;
  }
}
