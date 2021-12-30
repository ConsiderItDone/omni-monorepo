import { EntityRepository, Repository, DeleteResult } from "typeorm";
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

  public async countByParams(
    moduleId: number,
    eventTypeId: number,
    filters: any, // eslint-disable-line
    dateStart: Date,
    dateEnd: Date,
    extrinsicHash: string
  ): Promise<number> {
    const whereStr = this.getConditionStr(moduleId, eventTypeId, filters, dateStart, dateEnd, extrinsicHash);

    if (!filters) {
      // TODO: remove hot-fix, use quick count
      return 10000;
    }

    let sql: string;
    // all events without any filters
    if (whereStr == "") {
      sql = `SELECT reltuples::bigint AS count FROM pg_class WHERE oid = 'public.event'::regclass`;
    } else {
      sql = `
          SELECT count(*) as count
          FROM "public"."event" "event"
                   INNER JOIN block b on b.block_id = event.block_id
          ${whereStr}
          `;
    }

    const result = await this.query(sql);
    if (result.length) {
      return result[0].count;
    }

    return 0;
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
    const whereStr = this.getConditionStr(moduleId, eventTypeId, filters, dateStart, dateEnd, extrinsicHash);
    const orderStr = filters ? "ORDER BY b.number::character varying::bigint DESC" : "ORDER BY b.number DESC";

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
        ${orderStr}
        LIMIT ${take}
        OFFSET ${skip}
        `;

    const events = await this.query(sql);

    return this.create(events);
  }

  public deleteByBlockId(blockId: number): Promise<DeleteResult> {
    return this.delete({ blockId });
  }

  private getConditionStr(
    moduleId: number,
    eventTypeId: number,
    filters: any, // eslint-disable-line
    dateStart: Date,
    dateEnd: Date,
    extrinsicHash: string
  ): string {
    const wheres: string[] = [];

    if (moduleId) {
      wheres.push(`event.module_id = ${moduleId}`);
    }
    if (eventTypeId) {
      wheres.push(`event.event_type_id = ${eventTypeId}`);
    }
    if (filters) {
      Object.keys(filters).forEach((filter) => {
        wheres.push(`event.data @> '{"${filter}":"${filters[filter]}"}'`);
      });
    }

    if (dateStart || dateEnd) {
      if (dateStart) {
        wheres.push(`b.timestamp >= '${dateStart.toUTCString()}'::timestamp`);
      }
      if (dateEnd) {
        wheres.push(`b.timestamp <= '${dateEnd.toUTCString()}'::timestamp`);
      }
    }

    if (extrinsicHash) {
      wheres.push(`event.extrinsic_hash = ${extrinsicHash}`);
    }

    return wheres
      .map((where: string, index: number) => {
        return (index > 0 ? "AND " : "WHERE ") + where;
      })
      .join(" ");
  }
}
