import { EntityRepository, Repository, DeleteResult, FindConditions } from "typeorm";
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
          CEIL(CAST(e."data"->>'value' as numeric) / 10^12)
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

  public async findByParams(
    moduleId: number,
    eventTypeId: number,
    filters: any, // eslint-disable-line
    dateStart: Date,
    dateEnd: Date,
    extrinsicHash: string,
    skip: number,
    take: number
  ): Promise<Event[]> {
    const whereCondition: FindConditions<Event> = {};
    const wheres: string[] = [];
    // eslint-disable-next-line
    const parameters: any = [];

    if (moduleId) {
      wheres.push(`event.module_id = :moduleId`);
      parameters.moduleId = moduleId;
    }
    if (eventTypeId) {
      wheres.push(`event.event_type_id = :eventTypeId`);
      parameters.eventTypeId = eventTypeId;
    }
    if (filters) {
      Object.keys(filters).forEach((filter) => {
        wheres.push(`event.data @> '{"${filter}":"${filters[filter]}"}'`);
      });
    }

    if (dateStart || dateEnd) {
      whereCondition.block = {};
      if (dateStart) {
        wheres.push(`b.timestamp >= :dateStart`);
        parameters.dateStart = dateStart.toUTCString();
      }
      if (dateEnd) {
        wheres.push(`b.timestamp <= :dateEnd`);
        parameters.dateEnd = dateEnd.toUTCString();
      }
    }

    if (extrinsicHash) {
      wheres.push(`event.extrinsic_hash = :extrinsicHash`);
      parameters.extrinsicHash = extrinsicHash;
    }

    const whereStr = wheres.map((where: string, index: number) => {
      return (index > 0 ? "AND " : "WHERE ") + where;
    });

    const sql = `
        SELECT "event"."event_id"     AS "eventId",
             "event"."index"          AS "index",
             "event"."data"           AS "data",
             "event"."extrinsic_hash" AS "extrinsicHash",
             "event"."module_id"      AS "moduleId",
             "event"."event_type_id"  AS "eventTypeId",
             "event"."block_id"       AS "blockId",
             "event"."extrinsic_id"   AS "extrinsicId"
        FROM "public"."event" "event"
                 INNER JOIN block b on b.block_id = event.block_id
        ${whereStr}
        ORDER BY b.timestamp DESC
        LIMIT ${take}
        OFFSET ${skip}
        `;

    const events = await this.query(sql, parameters);

    return this.create(events);
  }

  public deleteByBlockId(blockId: number): Promise<DeleteResult> {
    return this.delete({ blockId });
  }
}
