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
import MQ from "@nodle/utils/dist/src/mq";

export function createBaseResolver<T extends ClassType>(
  suffix: string,
  objectTypeCls: T
): any {
  // eslint-disable-line
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
    @Query(() => objectTypeCls, { name: `get${suffix}ById` })
    async block(@Arg("id") id: number): Promise<T> {
      const entity = await (objectTypeCls as any).findOne(id); // eslint-disable-line
      if (entity === undefined) {
        throw new Error(`${suffix} ${id} not found`);
      }

      return entity;
    }

    @Query(() => [objectTypeCls], { name: `getAll${suffix}s` })
    protected async getAll(
      @Args() { take, skip, first, last }: PaginationArgs
    ): Promise<T[]> {
      if (first && last) {
        throw new Error("Bad request");
      }

      const order: any = {}; // eslint-disable-line
      order[`${suffix.toLowerCase()}Id`] = "DESC";

      if (first) {
        take = first;
        order[`${suffix.toLowerCase()}Id`] = "ASC";
      }

      if (last) {
        take = last;
        order[`${suffix.toLowerCase()}Id`] = "DESC";
      }

      return (objectTypeCls as any).find({
        // eslint-disable-line
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
