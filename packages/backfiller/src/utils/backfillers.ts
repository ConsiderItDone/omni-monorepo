import { Connection } from "typeorm";
import { ApiPromise } from "@polkadot/api";
import { saveAccount } from "@nodle/polkadot/src/misc";
import AccountId from "@polkadot/types/generic/AccountId";

export async function backfillAccounts(
  connection: Connection,
  api: ApiPromise
): Promise<void> {
  const accounts = await api.query.system.account.entries();

  for (const account of accounts) {
    saveAccount(connection, account[0] as AccountId, account[1]);
  }
}
