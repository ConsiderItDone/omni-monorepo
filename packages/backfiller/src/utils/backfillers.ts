import { Connection } from "typeorm";
import { ApiPromise } from "@polkadot/api";
import AccountRepository from "@nodle/db/src/repositories/public/accountRepository";
import BalanceRepository from "@nodle/db/src/repositories/public/balanceRepository";
import { StorageKey } from "@polkadot/types";
import { AccountInfo } from "@polkadot/types/interfaces/system";

export async function backfillAccounts(
  connection: Connection,
  api: ApiPromise
): Promise<void> {
  const accounts = await api.query.system.account.entries();

  for (const account of accounts) {
    saveAccount(connection, account);
  }
}

async function saveAccount(
  connection: Connection,
  account: [StorageKey, AccountInfo]
): Promise<void> {
  const accountRepository = connection.getCustomRepository(AccountRepository);
  const balanceRepository = connection.getCustomRepository(BalanceRepository);

  const address = account[0].toHuman().toString();
  const { nonce, refcount, data: balance } = account[1];

  const accountData = {
    address: address,
    nonce: nonce.toNumber(),
    refcount: refcount.toNumber(),
  };
  const savedAccount = await accountRepository.upsert(address, accountData);

  const { free, reserved, miscFrozen, feeFrozen } = balance;
  const balanceData = {
    account: savedAccount,
    free: free.toNumber(),
    reserved: reserved.toNumber(),
    miscFrozen: miscFrozen.toNumber(),
    feeFrozen: feeFrozen.toNumber(),
  };
  await balanceRepository.upsertByAccountAddress(
    savedAccount.address,
    balanceData
  );
}
