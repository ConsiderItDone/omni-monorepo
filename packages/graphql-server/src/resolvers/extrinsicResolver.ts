/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Resolver, FieldResolver, Root, Query, Arg, Args, ArgsType, Field, Int, ObjectType } from "type-graphql";
import { Min, Max } from "class-validator";
import { Block, Extrinsic, Event, Account, Module, EventType, ExtrinsicType } from "@nodle/db";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver, arrayFieldResolver } from "../fieldsResolver";
import { getConnection, getRepository, In, ILike } from "typeorm";
// import { cacheService } from "@nodle/utils/src/services/cacheService";
import { groupBy } from "lodash";
import { Loader } from "type-graphql-dataloader";
import DataLoader from "dataloader";

const ExtrinsicBaseResolver = createBaseResolver("Extrinsic", Extrinsic);

function groupByExtrinsicId<T>(items: T[]) {
  const newItems = [];
  for (const item of items) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const extrinsic of (item as any).extrinsics) {
      newItems.push(({
        extrinsicId: extrinsic.extrinsicId,
        ...item,
      } as any) as T); // eslint-disable-line
    }
  }

  return groupBy(newItems, "extrinsicId");
}

@ObjectType()
class ExtrinsicsResponse {
  @Field(() => [Extrinsic])
  items: Extrinsic[];

  @Field(() => Int)
  totalCount: number;
}

@ObjectType()
class ExtrinsicChartData {
  @Field(() => Date)
  date: Date;

  @Field(() => Int, { defaultValue: 0 })
  quantity: number;
}

@ArgsType()
class ExtrinsicsByType {
  @Field(() => Int, { defaultValue: 0 })
  @Min(0)
  skip: number;

  @Field(() => Int)
  @Min(1)
  @Max(100)
  take = 25;

  @Field(() => String, { defaultValue: "All", nullable: true })
  callModule?: string;

  @Field(() => String, { defaultValue: "All", nullable: true })
  callFunction?: string;

  @Field(() => Boolean, { defaultValue: false, nullable: true })
  signedOnly?: boolean;

  @Field(() => String, { nullable: true })
  signer?: string;

  @Field(() => Date, { nullable: true })
  dateStart?: Date;

  @Field(() => Date, { nullable: true })
  dateEnd?: Date;
}
@Resolver(Extrinsic)
export default class ExtrinsicResolver extends ExtrinsicBaseResolver {
  @Query(() => [Extrinsic])
  async extrinsicsByBlockNumber(@Arg("number") number: string): Promise<Extrinsic[]> {
    const extrinsics = await Extrinsic.createQueryBuilder("log")
      .leftJoin(Block, "block", "block.blockId = log.blockId")
      .where(`block.number = :number`, { number })
      .getMany();

    return extrinsics || [];
  }

  @Query(() => Extrinsic, { nullable: true })
  async extrinsicByHash(@Arg("hash") hash: string): Promise<Extrinsic | null> {
    // const cacheKey = `extrinsicByHash-${hash}`;
    // const cachedValue = await cacheService.get(cacheKey).then(JSON.parse);
    // if (cachedValue) {
    //   return cachedValue;
    // }

    const extrinsic = await Extrinsic.findOne({
      hash,
    });

    // if (extrinsic) {
    //   cacheService.set(cacheKey, extrinsic);
    // }

    return extrinsic;
  }
  @Query(() => Extrinsic, { nullable: true })
  async extrinsicById(@Arg("id") id: string): Promise<Extrinsic | null> {
    // const cacheKey = `extrinsicById-${id}`;
    // const cachedValue = await cacheService.get(cacheKey).then(JSON.parse);
    // if (cachedValue) {
    //   return cachedValue;
    // }

    if (id.length === 66) {
      const extrinsic = await Extrinsic.findOne({
        hash: id,
      });

      // if (extrinsic) {
      //   cacheService.set(cacheKey, extrinsic);
      // }

      return extrinsic;
    }

    const [blockNumber, index] = id.split("-");
    if (blockNumber && isNaN(parseInt(blockNumber)) && isNaN(parseInt(index))) {
      return null;
    }
    const extrinsic = await getRepository(Extrinsic).findOne({
      join: {
        alias: "extrinsic",
        innerJoin: { block: "extrinsic.block" },
      },
      // eslint-disable-next-line
      where: (qb: any) => {
        qb.where("block.number = :blockNumber", { blockNumber });
        if (index) {
          qb.andWhere({
            index,
          });
        }
      },
    });

    // if (extrinsic) {
    //   cacheService.set(cacheKey, extrinsic);
    // }

    return extrinsic;
  }

  @Query(() => ExtrinsicsResponse)
  async extrinsics(
    @Args()
    { take, skip, callModule, callFunction, signedOnly, signer, dateStart, dateEnd }: ExtrinsicsByType
  ): Promise<ExtrinsicsResponse> {
    const query = Extrinsic.createQueryBuilder("extrinsic")
      .take(take)
      .skip(skip)
      .orderBy("extrinsic.extrinsicId", "DESC");

    if (signedOnly) {
      query.andWhere(`extrinsic.is_signed = true`);
    }

    if (dateStart || dateEnd) {
      query.leftJoin(Block, "block", "block.block_id = extrinsic.block_id");

      if (dateStart) {
        query.andWhere(`block.timestamp > '${dateStart.toUTCString()}'::timestamp`);
      }
      if (dateEnd) {
        query.andWhere(`block.timestamp < '${dateEnd.toUTCString()}'::timestamp`);
      }
    }

    if (signer) {
      query.leftJoin(Account, "account", "account.account_id = extrinsic.signer_id");
      query.andWhere(`account.address ILIKE '${signer}'`);
    }

    if (callModule && callModule !== "All") {
      const module = await Module.findOne({
        name: ILike(callModule),
      });

      if (!module) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      query.andWhere(`extrinsic.module_id = ${module.moduleId}`);

      if (callFunction && callFunction !== "All") {
        const type = await ExtrinsicType.findOne({
          name: ILike(callFunction),
          moduleId: module.moduleId,
        });

        if (!type) {
          return {
            items: [],
            totalCount: 0,
          };
        }

        query.andWhere(`extrinsic.extrinsic_type_id = ${type.extrinsicTypeId}`);
      }
    }

    const result = await query.getMany();
    return { items: result, totalCount: 1000 };
  }

  @Query(() => [ExtrinsicChartData])
  async extrinsicsChartData(): Promise<ExtrinsicChartData[]> {
    const data = await getConnection().query(`
      select
        date_trunc('day', b."timestamp") as date,
        count(1) as quantity
      from public."extrinsic" e 
      left join public.block b on b.block_id = e.block_id 
      group by 1
      order by date DESC
      LIMIT 100
    `);

    return data || [];
  }

  @FieldResolver()
  @Loader<number, Block>(async (ids) => {
    const blocks = await Block.createQueryBuilder("block")
      .leftJoinAndSelect("block.extrinsics", "extrinsics")
      .where(`extrinsics.extrinsicId IN(:...ids)`, { ids })
      .getMany();

    const itemsByEventId = groupByExtrinsicId<Block>(blocks);
    return ids.map((id) => (itemsByEventId[id] && itemsByEventId[id]?.length >= 0 ? itemsByEventId[id][0] : null));
  })
  block(@Root() source: Extrinsic) {
    return (dataloader: DataLoader<number, Block>) => dataloader.load(source.extrinsicId);
  }

  @FieldResolver()
  async events(
    @Root() source: Extrinsic,
    @Arg("eventNames", () => [String], { nullable: true }) eventNames?: [string]
  ): Promise<Event[]> {
    const where = {} as any; // eslint-disable-line
    if (eventNames && !eventNames.includes("All")) {
      const types = await EventType.find({
        name: In(eventNames),
      });
      where.eventTypeId = In(types.map((t) => t.eventTypeId));
    }

    return arrayFieldResolver(source, Event, "extrinsicId", null, where);
  }

  @FieldResolver()
  @Loader<number, Account>(async (ids) => {
    const accounts = await Account.createQueryBuilder("account")
      .leftJoinAndSelect("account.extrinsics", "extrinsics")
      .where(`extrinsics.extrinsicId IN(:...ids)`, { ids })
      .getMany();

    const itemsByEventId = groupByExtrinsicId<Account>(accounts);
    return ids.map((id) => itemsByEventId[id][0] ?? null);
  })
  signer(@Root() source: Extrinsic) {
    return (dataloader: DataLoader<number, Account>) => dataloader.load(source.extrinsicId);
  }

  @FieldResolver()
  module(@Root() source: Extrinsic): Promise<Module> {
    return singleFieldResolver(source, Module, "moduleId");
  }

  @FieldResolver()
  extrinsicType(@Root() source: Extrinsic): Promise<ExtrinsicType> {
    return singleFieldResolver(source, ExtrinsicType, "extrinsicTypeId");
  }
}
