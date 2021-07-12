import { Arg, FieldResolver, Query, Resolver, Root } from "type-graphql";
import Account from "@nodle/db/models/public/account";
import Balance from "@nodle/db/models/public/balance";
import VestingSchedule from "@nodle/db/models/public/vestingSchedule";
import Extrinsic from "@nodle/db/models/public/extrinsic";
import Block from "@nodle/db/models/public/block";
import { createBaseResolver } from "../baseResolver";
import { arrayFieldResolver } from "../fieldsResolver";
import Application from "@nodle/db/models/public/application";
import RootCertificate from "@nodle/db/models/public/rootCertificate";

const AccountBaseResolver = createBaseResolver("Account", Account);

@Resolver(Account)
export default class AccountResolver extends AccountBaseResolver {
  @Query(() => Account, { nullable: true })
  async accountByAddress(@Arg("address") address: string): Promise<Account | null> {
    const account = await Account.findOne({
      address,
    });

    return account;
  }

  @FieldResolver(() => Balance, { nullable: true })
  async balance(@Root() source: Account): Promise<Balance> {
    const balance = await Balance.createQueryBuilder("balance")
      .leftJoin(Account, "account", "account.accountId = balance.accountId")
      .leftJoinAndSelect(Block, "block", "block.blockId = balance.blockId")
      .where("balance.blockId is not null")
      .andWhere(`account.address = :address`, { address: source.address })
      .addOrderBy("block.number", "DESC")
      .getOne();

    return balance;
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
