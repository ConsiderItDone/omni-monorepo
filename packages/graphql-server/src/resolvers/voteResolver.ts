import { FieldResolver, Resolver, Root } from "type-graphql";
import { createBaseResolver } from "../baseResolver";
import { Account, Application, Vote } from "@nodle/db/src/models";
import { singleFieldResolver } from "../fieldsResolver";

const VoteBaseResolver = createBaseResolver("Vote", Vote);

@Resolver(Vote)
export default class VoteResolver extends VoteBaseResolver {
  @FieldResolver()
  initiator(@Root() source: Vote): Promise<Account> {
    return singleFieldResolver(source, Account, "accountId", "initiatorId");
  }

  @FieldResolver()
  target(@Root() source: Vote): Promise<Account> {
    return singleFieldResolver(source, Account, "accountId", "targetId");
  }

  @FieldResolver()
  application(@Root() source: Vote): Promise<Application> {
    return singleFieldResolver(source, Account, "applicationId");
  }
}
