import {
  Resolver,
  FieldResolver,
  Root,
  Query,
  Arg,
  Args,
  ArgsType,
  Field,
  Int,
  ObjectType,
} from "type-graphql";
import { Min, Max } from "class-validator";
import Block from "@nodle/db/src/models/public/block";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import Event from "@nodle/db/src/models/public/event";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver, arrayFieldResolver } from "../fieldsResolver";
import { FindManyOptions, getRepository } from "typeorm";

const ExtrinsicBaseResolver = createBaseResolver("Extrinsic", Extrinsic);

@ObjectType()
class ExtrinsicsResponse {
  @Field(() => [Extrinsic])
  items: Extrinsic[];

  @Field(() => Int)
  totalCount: number;
}
@ArgsType()
class GetExtrinsicsByType {
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

  @Field(() => Int, { nullable: true })
  signerId?: number;
}
@Resolver(Extrinsic)
export default class ExtrinsicResolver extends ExtrinsicBaseResolver {
  @Query(() => [Extrinsic])
  async getExtrinsicsByBlockNumber(
    @Arg("number") number: string
  ): Promise<Extrinsic[]> {
    const extrinsics = await Extrinsic.createQueryBuilder("log")
      .leftJoin(Block, "block", "block.blockId = log.blockId")
      .where(`block.number = :number`, { number })
      .getMany();

    return extrinsics || [];
  }

  @Query(() => Extrinsic, { nullable: true })
  async getExtrinsicByHash(
    @Arg("hash") hash: string
  ): Promise<Extrinsic | null> {
    const extrinsic = await Extrinsic.findOne({
      hash,
    });

    return extrinsic;
  }
  @Query(() => Extrinsic, { nullable: true })
  async getExtrinsic(@Arg("id") id: string): Promise<Extrinsic | null> {
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
      where: (qb: any) => {
        qb.where("block.number = :blockNumber", { blockNumber }).andWhere({
          index,
        });
      },
    });
  }

  @Query(() => ExtrinsicsResponse)
  async getExtrinsics(
    @Args()
    {
      take,
      skip,
      callModule,
      callFunction,
      signedOnly,
      signerId,
    }: GetExtrinsicsByType
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

    let result;

    if (callModule === "All" && callFunction === "All") {
      result = await Extrinsic.findAndCount(findOptions);
    } else if (callFunction === "All") {
      result = await Extrinsic.findAndCount({
        ...findOptions,
        where: {
          callModule,
        },
      });
    } else if (callModule === "All") {
      result = await Extrinsic.findAndCount({
        ...findOptions,
        where: {
          callModuleFunction: callFunction,
        },
      });
    } else {
      result = await Extrinsic.findAndCount({
        ...findOptions,
        where: {
          callModule,
          callModuleFunction: callFunction,
        },
      });
    }
    return { items: result[0], totalCount: result[1] };
  }

  @FieldResolver()
  block(@Root() source: Extrinsic): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
  }

  @FieldResolver()
  events(@Root() source: Extrinsic): Promise<Event[]> {
    return arrayFieldResolver(source, Event, "extrinsicId");
  }
}
