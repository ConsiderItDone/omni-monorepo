import { Resolver, FieldResolver, Root, Query, Arg, Args, ArgsType, Field, Int, ObjectType } from "type-graphql";
import { Min, Max } from "class-validator";
import Block from "@nodle/db/src/models/public/block";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import Event from "@nodle/db/src/models/public/event";
import Account from "@nodle/db/src/models/public/account";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver, arrayFieldResolver } from "../fieldsResolver";
import { FindManyOptions, getConnection, getRepository, In } from "typeorm";
import EventType from "@nodle/db/src/models/public/eventType";
import Module from "@nodle/db/src/models/public/module";
import ExtrinsicType from "@nodle/db/src/models/public/extrinsicType";

const ExtrinsicBaseResolver = createBaseResolver("Extrinsic", Extrinsic);

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
    const extrinsic = await Extrinsic.findOne({
      hash,
    });

    return extrinsic;
  }
  @Query(() => Extrinsic, { nullable: true })
  async extrinsicById(@Arg("id") id: string): Promise<Extrinsic | null> {
    if (id.length === 66) {
      return await Extrinsic.findOne({
        hash: id,
      });
    }

    const [blockNumber, index] = id.split("-");
    return await getRepository(Extrinsic).findOne({
      join: {
        alias: "extrinsic",
        innerJoin: { block: "extrinsic.block" },
      },
      // eslint-disable-next-line
      where: (qb: any) => {
        qb.where("block.number = :blockNumber", { blockNumber }).andWhere({
          index,
        });
      },
    });
  }

  @Query(() => ExtrinsicsResponse)
  async extrinsics(
    @Args()
    { take, skip, callModule, callFunction, signedOnly, signer, dateStart, dateEnd }: ExtrinsicsByType
  ): Promise<ExtrinsicsResponse> {
    const findOptions: FindManyOptions<Extrinsic> = {
      take,
      skip,
      order: {
        extrinsicId: "DESC",
      },
    };
    if (signedOnly) {
      findOptions.where = { isSigned: true };
    }

    if (dateStart) {
    } else if (dateEnd) {
    } else if (dateStart && dateEnd) {
    }

    if (signer) {
      const { accountId } = await Account.findOne({ where: { address: signer } });
      findOptions.where = Object.assign(findOptions.where || {}, { signerId: accountId });
    }

    let module: Module;
    if (callModule !== "All") {
      module = await Module.findOne({
        name: callModule,
      });
    }
    let type: ExtrinsicType;
    if (callFunction !== "All") {
      type = await ExtrinsicType.findOne({
        name: callFunction,
      });
    }

    let result;

    if (callModule === "All" && callFunction === "All") {
      result = await Extrinsic.findAndCount(findOptions);
    } else if (callFunction === "All") {
      result = await Extrinsic.findAndCount({
        ...findOptions,
        where: {
          moduleId: module ? module.moduleId : null,
        },
      });
    } else if (callModule === "All") {
      result = await Extrinsic.findAndCount({
        ...findOptions,
        where: {
          extrinsicTypeId: type ? type.extrinsicTypeId : null,
        },
      });
    } else {
      result = await Extrinsic.findAndCount({
        ...findOptions,
        where: {
          moduleId: module ? module.moduleId : null,
          extrinsicTypeId: type ? type.extrinsicTypeId : null,
        },
      });
    }

    return { items: result[0], totalCount: result[1] };
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
    `);

    return data || [];
  }

  @FieldResolver()
  block(@Root() source: Extrinsic): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
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
  signer(@Root() source: Extrinsic): Promise<Account> {
    return singleFieldResolver(source, Account, "accountId", "signerId");
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
