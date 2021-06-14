import { FieldResolver, Resolver, Root } from "type-graphql";
import { createBaseResolver } from "../baseResolver";
import { Account, Application, Vote } from "@nodle/db/src/models";
import { singleFieldResolver } from "../fieldsResolver";

const VoteBaseResolver = createBaseResolver("Vote", Vote);

@Resolver(Vote)
export default class VoteResolver extends VoteBaseResolver {
  @FieldResolver()
  initiator(@Root() source: Vote): Promise<Account> {
    return singleFieldResolver(source, Account, "initiatorId", "accountId");
  }

  @FieldResolver()
  target(@Root() source: Vote): Promise<Account> {
    return singleFieldResolver(source, Account, "targetId", "accountId");
  }

  @FieldResolver()
  application(@Root() source: Vote): Promise<Application> {
    return singleFieldResolver(source, Account, "applicationId");
  }
}
