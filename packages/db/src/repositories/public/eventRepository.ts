import { EntityRepository, Repository } from "typeorm";
import Event from "../../models/public/event";

@EntityRepository(Event)
export default class EventRepository extends Repository<Event> {
  public async add({
    index,
    data,
    extrinsicHash,
    extrinsicId,
    moduleId,
    eventTypeId,
    blockId,
    accountId,
  }: {
    index: number;
    data: string | unknown;
    extrinsicHash: string | null;
    extrinsicId: number | null;
    moduleId: number | null;
    eventTypeId: number;
    blockId: number;
    accountId: number;
  }): Promise<Event> {
    const event = await this.save({
      index,
      data,
      extrinsicHash,
      extrinsicId,
      moduleId,
      eventTypeId,
      blockId,
      accountId,
    });

    return event;
  }
}
