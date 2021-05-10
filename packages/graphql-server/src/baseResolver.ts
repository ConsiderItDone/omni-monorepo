import {
  Resolver,
  Query,
  Args,
  ClassType,
  Int,
  ArgsType,
  Field,
  Subscription,
  Root,
  Arg,
} from "type-graphql";
import { Min, Max } from "class-validator";
import MQ from "@nodle/utils/src/mq";
import { Utils } from "@nodle/utils/src";

export function createBaseResolver<T extends ClassType>(
  suffix: string,
  objectTypeCls: T
  // eslint-disable-next-line
): any {
  @ArgsType()
  class PaginationArgs {
    @Field(() => Int, { defaultValue: 0 })
    @Min(0)
    skip: number;

    @Field(() => Int, { defaultValue: 25 })
    @Min(1)
    @Max(100)
    take = 25;

    @Field(() => Int)
    @Max(100)
    first = 0;

    @Field(() => Int)
    @Max(100)
    last = 0;
  }

  @Resolver({ isAbstract: true })
  abstract class BaseResolver {
    @Query(() => objectTypeCls, {
      name: `${Utils.lowerCaseFirstLetter(suffix)}ById`,
      nullable: true,
    })
    async getById(@Arg("id") id: number): Promise<T> {
      const entity = await (objectTypeCls as any).findOne(id); // eslint-disable-line
      if (entity === undefined) {
        return null;
      }

      return entity;
    }

    @Query(() => [objectTypeCls], {
      name: `${Utils.lowerCaseFirstLetter(suffix)}s`,
    })
    protected async getAll(
      @Args() { take, skip, first, last }: PaginationArgs
    ): Promise<T[]> {
      if (first && last) {
        throw new Error("Bad request");
      }

      const order: any = {}; // eslint-disable-line
      order[`${Utils.lowerCaseFirstLetter(suffix)}Id`] = "DESC";

      if (first) {
        take = first;
        order[`${Utils.lowerCaseFirstLetter(suffix)}Id`] = "ASC";
      }

      if (last) {
        take = last;
        order[`${Utils.lowerCaseFirstLetter(suffix)}Id`] = "DESC";
      }

      // eslint-disable-next-line
      return (objectTypeCls as any).find({
        take,
        skip,
        order,
      });
    }

    @Subscription(() => objectTypeCls, {
      name: `new${suffix}`,
      subscribe: () => MQ.getMQ().on(`new${suffix}`),
    })
    newEntity(@Root() entity: T): T {
      return entity;
    }
  }

  return BaseResolver;
}
