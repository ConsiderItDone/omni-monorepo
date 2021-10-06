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
  }: {
    index: number;
    data: string | unknown;
    extrinsicHash: string | null;
    extrinsicId: number | null;
    moduleId: number | null;
    eventTypeId: number;
    blockId: number;
  }): Promise<Event> {
    const event = await this.save({
      index,
      data,
      extrinsicHash,
      extrinsicId,
      moduleId,
      eventTypeId,
      blockId,
    });

    return event;
  }

  // eslint-disable-next-line
  public getStats(eventTypeId: number): Promise<any> {
    return this.query(
      `
      select
        date_trunc('day', b."timestamp") as date,
        count(1) as quantity,
        sum(
          CEIL(CAST(e."data"->>'value' as BIGINT) / 10^12)
        ) as amount
      from public."event" e 
      left join public.block b on b.block_id = e.block_id 
      where e.event_type_id = $1
      group by 1
      ORDER BY date
      LIMIT 100
    `,
      [eventTypeId]
    );
  }
}
