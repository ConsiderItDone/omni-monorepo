import { Args, ArgsType, Field, FieldResolver, Int, ObjectType, Query, Resolver, Root } from "type-graphql";
import { ExtrinsicType, Module } from "@nodle/db";
import { createBaseResolver } from "../baseResolver";

import { singleFieldResolver } from "../fieldsResolver";
import { FindConditions } from "typeorm";

const ExtrinsicTypeBaseResolver = createBaseResolver("ExtrinsicType", ExtrinsicType, "name", "ASC");

@ArgsType()
class ExtrinsicTypesArgs {
  @Field(() => String, { nullable: true })
  moduleName?: string;

  @Field(() => Int, { nullable: true })
  moduleId?: number;
}

@ObjectType(`ExtrinsicTypeResponse`)
class ExtrinsicTypeResponse {
  @Field(() => [ExtrinsicType])
  items: ExtrinsicType[];

  @Field(() => Int)
  totalCount: number;
}

@Resolver(ExtrinsicType)
export default class ExtrinsicTypeResolver extends ExtrinsicTypeBaseResolver {
  @Query(() => ExtrinsicTypeResponse)
  async extrinsicTypes(@Args() { moduleName, moduleId }: ExtrinsicTypesArgs): Promise<ExtrinsicTypeResponse> {
    if (moduleName) {
      const module = await Module.findOne({
        name: moduleName,
      });

      moduleId = module.moduleId;
    }

    const where = {} as FindConditions<ExtrinsicType>;
    if (moduleId) {
      where.moduleId = moduleId;
    }

    const items = await ExtrinsicType.find({
      where,
    });

    return {
      items,
      totalCount: items.length,
    };
  }

  @FieldResolver()
  module(@Root() source: ExtrinsicType): Promise<Module> {
    return singleFieldResolver(source, Module, "moduleId");
  }
}
