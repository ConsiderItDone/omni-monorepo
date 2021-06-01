import {
  Args,
  ArgsType,
  Field,
  FieldResolver,
  Int,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import ExtrinsicType from "@nodle/db/src/models/public/extrinsicType";
import { createBaseResolver } from "../baseResolver";
import Module from "@nodle/db/src/models/public/module";
import { singleFieldResolver } from "../fieldsResolver";

const ExtrinsicTypeBaseResolver = createBaseResolver(
  "ExtrinsicType",
  ExtrinsicType
);

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
  async extrinsicTypes(
    @Args() { moduleName, moduleId }: ExtrinsicTypesArgs
  ): Promise<ExtrinsicTypeResponse> {
    if (moduleName) {
      const module = await Module.findOne({
        name: moduleName,
      });

      moduleId = module.moduleId;
    }

    const items = await ExtrinsicType.find({
      where: {
        moduleId: moduleId ? moduleId : null,
      },
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
