import { Resolver } from "type-graphql";
import Account from "@nodle/db/src/models/public/account";
import { createBaseResolver } from "../baseResolver";

const AccountBaseResolver = createBaseResolver("Account", Account);

@Resolver(Account)
export default class AccountResolver extends AccountBaseResolver {}
