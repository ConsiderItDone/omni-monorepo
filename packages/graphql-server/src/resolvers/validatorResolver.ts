import { Arg, FieldResolver, Query, Resolver, Root } from "type-graphql";
import Account from "@nodle/db/models/public/account";
import Validator from "@nodle/db/models/public/validator";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";
import { getRepository } from "typeorm";

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
  account(@Root() source: Validator): Promise<Account> {
    return singleFieldResolver(source, Account, "accountId");
  }
}
