import { EntityRepository, Repository } from "typeorm";
import Event from "../../models/public/event";

@EntityRepository(Event)
export default class EventRepository extends Repository<Event> {
  public async add({
    index,
    data,
    extrinsicHash,
    extrinsicId,
    moduleName,
    eventName,
    blockId,
  }: {
    index: number;
    data: string;
    extrinsicHash: string | null;
    extrinsicId: number | null;
    moduleName: string;
    eventName: string;
    blockId: number;
  }): Promise<Event> {
    const event = await this.save({
      index,
      data,
      extrinsicHash,
      extrinsicId,
      moduleName,
      eventName,
      blockId,
    });

    return event;
  }
}
