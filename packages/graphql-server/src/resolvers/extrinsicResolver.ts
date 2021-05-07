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
} from "type-graphql";
import { Min, Max } from "class-validator";
import Block from "@nodle/db/src/models/public/block";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import Event from "@nodle/db/src/models/public/event";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver, arrayFieldResolver } from "../fieldsResolver";
import { FindManyOptions } from "typeorm";

const ExtrinsicBaseResolver = createBaseResolver("Extrinsic", Extrinsic);

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

  @Query(() => [Extrinsic])
  async getExtrinsicByType(
    @Args()
    { take, skip, callModule, callFunction, signedOnly }: GetExtrinsicsByType
  ): Promise<Extrinsic[]> {
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
    if (callModule === "All" && callFunction === "All") {
      return Extrinsic.find(findOptions);
    }
    if (callFunction === "All") {
      return Extrinsic.find({
        ...findOptions,
        where: {
          callModule,
        },
      });
    }
    return Extrinsic.find({
      ...findOptions,
      where: {
        callModule,
        callModuleFunction: callFunction,
      },
    });
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
