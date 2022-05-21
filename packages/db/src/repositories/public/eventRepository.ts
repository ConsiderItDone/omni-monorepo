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
      ORDER BY date DESC
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
    const [whereStr, parameters] = this.getConditionStr(
      moduleId,
      eventTypeId,
      filters,
      dateStart,
      dateEnd,
      extrinsicHash
    );

    if (!filters || !Object.keys(filters).length) {
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

    const result = await this.query(sql, parameters);
    if (result.length) {
      return result[0].count;
    }

    return 0;
  }

  public getOrderBy(orderBy: [string, "ASC" | "DESC"]): string {
    const [value, direction] = orderBy;
    switch (value) {
      case "date":
        return `ORDER BY b.timestamp ${direction}`;
      case "value":
        return `ORDER BY (event.data->>'value')::bigint ${direction}`;
      case "address":
        return `ORDER BY event.data->>'from' ${direction}`;
    }
  }

  public async findByParams(
    moduleId: number,
    eventTypeId: number,
    filters: any, // eslint-disable-line
    dateStart: Date,
    dateEnd: Date,
    extrinsicHash: string,
    skip = 0,
    take = 10,
    orderBy?: [string, "ASC" | "DESC"]
  ): Promise<Event[]> {
    const [whereStr, parameters] = this.getConditionStr(
      moduleId,
      eventTypeId,
      filters,
      dateStart,
      dateEnd,
      extrinsicHash
    );

    const orderStr =
      filters?.fromTo && orderBy && orderBy.length === 2
        ? this.getOrderBy(orderBy)
        : `ORDER BY "event"."event_id" DESC`;

    const sql = `SELECT "event"."event_id" AS "eventId", "event"."index" AS "index", "event"."data" AS "data", "event"."extrinsic_hash" AS "extrinsicHash", "event"."extrinsic_hash" AS "extrinsicHash", "event"."extrinsic_hash" AS "extrinsicHash", "event"."module_id" AS "moduleId", "event"."event_type_id"  AS "eventTypeId", "event"."block_id" AS "blockId", "event"."extrinsic_id" AS "extrinsicId" FROM "public"."event" "event"  INNER JOIN block b on b.block_id = event.block_id ${whereStr} ${
      orderStr + " " ? orderStr : ""
    } ${take > 0 ? `LIMIT ${take} ` : ""}OFFSET ${skip}`;

    const events = await this.query(sql, parameters);

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
  ): [string, (string | number)[]] {
    const wheres: string[] = [];

    let order = 0;
    const arr: (number | string)[] = [];

    if (moduleId) {
      wheres.push(`event.module_id = $${++order}`);
      arr.push(moduleId);
    }
    if (eventTypeId) {
      wheres.push(`event.event_type_id = $${++order}`);
      arr.push(eventTypeId);
    }
    if (filters) {
      Object.keys(filters).forEach((filter) => {
        if (filter === "fromTo") {
          wheres.push(`(event.data @> $${++order} OR event.data @> $${++order})`);
          arr.push(`{"to":"${filters[filter]}"}`);
          arr.push(`{"from":"${filters[filter]}"}`);
        } else {
          wheres.push(`event.data @> $${++order}`);
          arr.push(`{"${filter}":"${filters[filter]}"}`);
        }
      });
    }

    if (dateStart || dateEnd) {
      if (dateStart) {
        wheres.push(`b.timestamp >= $${++order}::timestamp`);
        arr.push(`${dateStart.toUTCString()}`);
      }
      if (dateEnd) {
        wheres.push(`b.timestamp <= $${++order}::timestamp`);
        arr.push(`${dateEnd.toUTCString()}`);
      }
    }

    if (extrinsicHash) {
      wheres.push(`event.extrinsic_hash = $${++order}`);
      arr.push(extrinsicHash);
    }

    return [
      wheres
        .map((where: string, index: number) => {
          return (index > 0 ? "AND " : "WHERE ") + where;
        })
        .join(" "),
      arr,
    ];
  }
}
