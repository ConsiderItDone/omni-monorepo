import { Arg, Args, ArgsType, Field, FieldResolver, Int, Query, Resolver, Root } from "type-graphql";
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { Min, Max } from "class-validator";
import Account from "@nodle/db/src/models/public/account";
import Balance from "@nodle/db/src/models/public/balance";
import VestingSchedule from "@nodle/db/src/models/public/vestingSchedule";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import { createBaseResolver } from "../baseResolver";
import { arrayFieldResolver } from "../fieldsResolver";
import { RootCertificate, Application } from "@nodle/db/src/models";
import { BalanceService } from "@nodle/utils/src/services";
import { SS58_FORMAT } from '../consts'

const AccountBaseResolver = createBaseResolver("Account", Account);

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
    const decoded = decodeAddress(address.trim())
    const encoded = encodeAddress(decoded, SS58_FORMAT)
    const account = await Account.findOne({
      address: encoded,
    });

    return account;
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
