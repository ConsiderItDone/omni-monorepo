import { Arg, FieldResolver, Query, Resolver, Root } from "type-graphql";
import Account from "@nodle/db/src/models/public/account";
import Balance from "@nodle/db/src/models/public/balance";
import VestingSchedule from "@nodle/db/src/models/public/vestingSchedule";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import { createBaseResolver } from "../baseResolver";
import { arrayFieldResolver, singleFieldResolver } from "../fieldsResolver";
import { RootCertificate, Application } from "@nodle/db/src/models";

const AccountBaseResolver = createBaseResolver("Account", Account);

@Resolver(Account)
export default class AccountResolver extends AccountBaseResolver {
  @Query(() => Account, { nullable: true })
  async accountByAddress(
    @Arg("address") address: string
  ): Promise<Account | null> {
    const account = await Account.findOne({
      address,
    });

    return account;
  }

  @FieldResolver()
  balance(@Root() source: Account): Promise<Balance> {
    return singleFieldResolver(source, Balance, "accountId");
  }

  @FieldResolver()
  vestingSchedules(@Root() source: Account): Promise<VestingSchedule[]> {
    return arrayFieldResolver(source, VestingSchedule, "accountId");
  }

  @FieldResolver()
  extrinsics(@Root() source: Account): Promise<Extrinsic[]> {
    return arrayFieldResolver(source, Extrinsic, "signerId", "accountId");
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
