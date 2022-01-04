import { Arg, FieldResolver, Query, Resolver, Root } from "type-graphql";
import Account from "@nodle/db/src/models/public/account";
import Validator from "@nodle/db/src/models/public/validator";
import { createBaseResolver } from "../baseResolver";
import DataLoader from "dataloader";
import { getRepository } from "typeorm";
import { Loader } from "type-graphql-dataloader";
import { groupBy } from "lodash";

const ValidatorBaseResolver = createBaseResolver("Validator", Validator);

@Resolver(Validator)
export default class ValidatorResolver extends ValidatorBaseResolver {
  @Query(() => Validator, { nullable: true })
  async validatorByAddress(@Arg("address") address: string): Promise<Validator | null> {
    const validator = await getRepository(Validator).findOne({
      join: {
        alias: "validators",
        innerJoin: { account: "validators.account" },
      },
      // eslint-disable-next-line
      where: (qb: any) => {
        qb.where("account.address = :address", { address });
      },
    });

    return validator;
  }

  @FieldResolver()
  @Loader<number, Account>(async (validatorIds) => {
    const items = await Account.createQueryBuilder("account")
      .leftJoinAndSelect("account.validator", "validator")
      .where(`validator.validatorId IN(:...validatorIds)`, { validatorIds })
      .getMany();

    const itemsByEventId = groupBy(items, "validator.validatorId");
    return validatorIds.map((id) => ((itemsByEventId[id][0] as any) as Account) ?? null);
  })
  account(@Root() source: Validator) {
    return (dataloader: DataLoader<number, Account>) => dataloader.load(source.validatorId);
  }
}
