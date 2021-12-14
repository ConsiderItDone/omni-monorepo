import { ApiPromise } from "@polkadot/api";
import { EntityManager } from "typeorm";
import type { AccountId, BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";
import type { BlockHash } from "@polkadot/types/interfaces/chain";
import { saveAccount, tryFetchAccount } from "../misc";

import { GenericAccountId } from "@polkadot/types";
import { logger, LOGGER_ERROR_CONST } from "@nodle/utils/src/logger";
import { Account, Balance } from "../../../db/src/models";
import AccountRepository from "@nodle/db/src/repositories/public/accountRepository";
import { Block } from "@nodle/db/dist/src/models";
import BalanceRepository from "@nodle/db/src/repositories/public/balanceRepository";

export async function handleBalance(
  manager: EntityManager,
  event: Event,
  blockId: number,
  api: ApiPromise,
  blockHash: BlockHash,
  blockNumber: BlockNumber
): Promise<[{ savedAccount: Account; savedBalance?: Balance }, { savedAccount: Account; savedBalance?: Balance }?]> {
  try {
    switch (event.method) {
      case "Transfer": {
        try {
          console.log("transfer");
          const savedAccountBalanceFrom = await handleAccountBalance(event.data[0] as GenericAccountId);
          const savedAccountBalanceTo = await handleAccountBalance(event.data[1] as GenericAccountId);
          return [savedAccountBalanceFrom, savedAccountBalanceTo];
        } catch (accountSaveError) {
          logger.error(LOGGER_ERROR_CONST.ACCOUNT_SAVE_ERROR(blockNumber.toNumber()), accountSaveError);
        }
        break;
      }
      case "DustLost":
      case "Unreserved":
      case "Reserved": {
        try {
          const savedAccountBalance = await handleAccountBalance(event.data[1] as GenericAccountId);
          return [savedAccountBalance];
        } catch (accountSaveError) {
          logger.error(LOGGER_ERROR_CONST.ACCOUNT_SAVE_ERROR(blockNumber.toNumber()), accountSaveError);
        }
        break;
      }
      default:
        return;
    }
  } catch (error) {
    logger.error(error);
  }

  async function handleAccountBalance(address: AccountId | string) {
    console.log("????before repos");
    const accountRepository = manager.getCustomRepository(AccountRepository);
    console.log("????After repos");

    logger.info("before");
    const savedAccount = await accountRepository.findOne({ where: { address: address.toString() } });
    console.log("after");
    if (savedAccount) {
      console.log("!!!!!!!!!!!!!!!!!!!! acc", savedAccount);

      const savedBalance = await Balance.createQueryBuilder("balance")
        .innerJoin(Block, "block", "block.blockId = balance.blockId")
        .where(`balance.accountId =:accountId`, { accountId: savedAccount.accountId })
        .orderBy("block.number", "DESC")
        .limit(1)
        .getOne();
      console.log("!!!!!!!!!!!!!!!!!!!! savedBalance", savedBalance);

      if (savedBalance) {
        const isOldBalance = Number(savedBalance.block.number) < blockNumber.toNumber();
        if (isOldBalance) {
          return await saveAccountBalance({ accountId: savedAccount.accountId, balanceId: savedBalance.balanceId });
        }
        return { savedAccount, savedBalance };
      }
      return await saveAccountBalance({ accountId: savedAccount.accountId });
    }
    return await saveAccountBalance();

    async function saveAccountBalance(options?: { accountId?: number; balanceId?: number }) {
      const account = await tryFetchAccount(api, address, blockHash, blockNumber);
      return await saveAccount(manager, account, blockId, options);
    }
  }
}
