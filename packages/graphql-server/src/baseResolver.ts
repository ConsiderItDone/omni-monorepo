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
  ObjectType,
} from "type-graphql";
import { Min, Max } from "class-validator";
import { MQ, Utils } from "@nodle/utils";
import { cacheService } from "@nodle/utils";
import { withFilter } from "apollo-server";
@ArgsType()
export class PaginationArgs {
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

export function createBaseResolver<T extends ClassType>(
  suffix: string,
  objectTypeCls: T,
  orderByParam?: string,
  orderDirection: "DESC" | "ASC" = "DESC"
  // eslint-disable-next-line
): any {
  @ObjectType(`${suffix}Response`)
  class BaseResponse {
    @Field(() => [objectTypeCls])
    items: T[];

    @Field(() => Int)
    totalCount: number;
  }

  @Resolver({ isAbstract: true })
  abstract class BaseResolver {
    private lastNumber = -1;
    private orderBy = orderByParam ? orderByParam : `${Utils.lowerCaseFirstLetter(suffix)}Id`;

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

    @Query(() => BaseResponse, {
      name: `${Utils.lowerCaseFirstLetter(suffix)}s`,
    })
    protected async getAll(@Args() { take, skip, first, last }: PaginationArgs): Promise<BaseResponse> {
      if (first && last) {
        throw new Error("Bad request");
      }

      const order: any = {}; // eslint-disable-line
      order[this.orderBy] = orderDirection;

      if (first) {
        take = first;
        order[this.orderBy] = "ASC";
      }

      if (last) {
        take = last;
        order[this.orderBy] = "DESC";
      }

      const options = { take, skip, order };

      if (suffix === "Block") {
        const items = await (objectTypeCls as any).find(options);

        const cachedTotal = await cacheService.get("totalBlocks-cache");
        const totalCount = cachedTotal ? Number(JSON.parse(cachedTotal)) : 1000;

        return { items, totalCount };
      }

      const [items, totalCount] = await (objectTypeCls as any).findAndCount(options);
      return { items, totalCount };
    }

    @Subscription(() => objectTypeCls, {
      name: `new${suffix}`,
      subscribe: withFilter(
        () => MQ.getMQ().on(`new${suffix}`),
        (payload) => {
          let isValid = true;
          if (payload.number) {
            // NOD-140 Subscription: ID filtering
            if (this.lastNumber && Number(payload.number) <= this.lastNumber) {
              isValid = false;
            }

            this.lastNumber = Number(payload.number);
          }

          if (payload.timestamp) {
            // NOD-128 Unable to serialize value as it's not an instance of 'Date'"
            payload.timestamp = new Date(payload.timestamp);
          }

          return isValid;
        }
      ),
    })
    newEntity(@Root() entity: T): T {
      return entity;
    }
  }

  return BaseResolver;
}
