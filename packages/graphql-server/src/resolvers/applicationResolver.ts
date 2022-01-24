import { FieldResolver, Resolver, Root } from "type-graphql";
import { Application, Block, Account, Vote } from "@nodle/db/index";
import { createBaseResolver } from "../baseResolver";
import { arrayFieldResolver, singleFieldResolver } from "../fieldsResolver";

const ApplicationBaseResolver = createBaseResolver("Application", Application);

@Resolver(Application)
export default class ApplicationResolver extends ApplicationBaseResolver {
  @FieldResolver()
  block(@Root() source: Application): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
  }

  @FieldResolver()
  candidate(@Root() source: Application): Promise<Account> {
    return singleFieldResolver(source, Account, "accountId", "candidateId");
  }

  @FieldResolver()
  challenger(@Root() source: Application): Promise<Account> {
    return singleFieldResolver(source, Account, "accountId", "challengerId");
  }

  @FieldResolver({ nullable: true })
  votes(@Root() source: Application): Promise<Vote[]> {
    return arrayFieldResolver(source, Vote, "applicationId");
  }
}
