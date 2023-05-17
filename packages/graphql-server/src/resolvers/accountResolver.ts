import { Account, Balance, VestingSchedule, Extrinsic, Application, RootCertificate } from "@omni/db";
import { createBaseResolver, PaginationArgs } from "../baseResolver";
import { arrayFieldResolver } from "../fieldsResolver";
import { Arg, Args, ArgsType, Field, FieldResolver, Int, ObjectType, Query, Resolver, Root } from "type-graphql";
import { Min, Max } from "class-validator";
import { BalanceService } from "@omni/utils";

const AccountBaseResolver = createBaseResolver("Account", Account);

@ObjectType(`AccountResponse`)
class AccountResponse {
  @Field(() => [Account])
  items: Account[];

  @Field(() => Int)
  totalCount: number;
}

@ArgsType()
class AccountExtrinsicsArgs {
  @Field(() => Int, { defaultValue: 0 })
  @Min(0)
  skip: number;

  @Field(() => Int, { defaultValue: 25 })
  @Min(1)
  @Max(100)
  take?: number;
}

@Resolver(Account)
export default class AccountResolver extends AccountBaseResolver {
  @Query(() => Account, { nullable: true })
  async accountByAddress(@Arg("address") address: string): Promise<Account | null> {
    const account = await Account.findOne({
      address,
    });

    return account;
  }

  @Query(() => AccountResponse)
  async accounts(@Args() { take, skip, first, last }: PaginationArgs): Promise<AccountResponse> {
    if (first && last) {
      throw new Error("Bad request");
    }

    const order: any = {}; // eslint-disable-line
    order["accountId"] = "DESC";

    if (first) {
      take = first;
      order["accountId"] = "ASC";
    }

    if (last) {
      take = last;
      order["accountId"] = "DESC";
    }

    console.time(`accounts`);
    const items = await Account.find({
      take,
      skip,
      order,
    });
    console.timeEnd(`accounts`);

    return {
      items,
      totalCount: 10000, // @TODO
    };
  }

  @FieldResolver(() => Balance, { nullable: true })
  balance(@Root() source: Account): Promise<Balance> {
    const balanceService = new BalanceService();

    return balanceService.getBalanceByAddress(source.address);
  }

  @FieldResolver()
  vestingSchedules(@Root() source: Account): Promise<VestingSchedule[]> {
    return arrayFieldResolver(source, VestingSchedule, "accountId");
  }

  @FieldResolver()
  extrinsics(@Root() source: Account, @Args() args: AccountExtrinsicsArgs): Promise<Extrinsic[]> {
    return arrayFieldResolver(source, Extrinsic, "signerId", "accountId", {}, null, args.take, args.skip);
  }

  @FieldResolver()
  rootCertificatesByOwner(@Root() source: Account): Promise<RootCertificate[]> {
    return arrayFieldResolver(source, RootCertificate, "ownerId", "accountId");
  }

  @FieldResolver()
  rootCertificatesByKey(@Root() source: Account): Promise<RootCertificate[]> {
    return arrayFieldResolver(source, RootCertificate, "keyId", "accountId");
  }

  @FieldResolver()
  applicationsByChallenger(@Root() source: Account): Promise<Application[]> {
    return arrayFieldResolver(source, Application, "challengerId", "accountId");
  }

  @FieldResolver()
  applicationsByCandidate(@Root() source: Account): Promise<Application[]> {
    return arrayFieldResolver(source, Application, "candidateId", "accountId");
  }
}
