import { Resolver } from "type-graphql";
import Balance from "@nodle/db/src/models/public/balance";
import { createBaseResolver } from "../baseResolver";

const BalanceBaseResolver = createBaseResolver("Balance", Balance);

@Resolver(Balance)
export default class BalanceResolver extends BalanceBaseResolver {}
