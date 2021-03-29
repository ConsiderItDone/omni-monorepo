import { Connection } from "typeorm";
import { ApiPromise } from "@polkadot/api";
import {saveAccount } from "@nodle/polkadot/src/misc"

export async function backfillAccounts(
  connection: Connection,
  api: ApiPromise
): Promise<void> {
  const accounts = await api.query.system.account.entries();

  for (const account of accounts) {
    saveAccount(connection, account);
  }
}
