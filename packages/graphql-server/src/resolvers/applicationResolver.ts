import { FieldResolver, Resolver, Root } from "type-graphql";
import Application from "@nodle/db/src/models/public/application";
import Block from "@nodle/db/src/models/public/block";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";
import { Account } from "@nodle/db/src/models";

const ApplicationBaseResolver = createBaseResolver("Application", Application);

@Resolver(Application)
export default class ApplicationResolver extends ApplicationBaseResolver {
  @FieldResolver()
  block(@Root() source: Application): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
  }

  @FieldResolver()
  account(@Root() source: Application): Promise<Account> {
    return singleFieldResolver(source, Account, "accountId");
  }
}
