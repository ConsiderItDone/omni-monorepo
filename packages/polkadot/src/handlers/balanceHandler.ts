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

export async function handleBalance(
  manager: EntityManager,
  event: Event,
  blockId: number,
  api: ApiPromise,
  blockHash: BlockHash,
  blockNumber: BlockNumber
): Promise<[{ savedAccount: Account; savedBalance?: Balance }, { savedAccount: Account; savedBalance?: Balance }?]> {
  const accountRepository = manager.getCustomRepository(AccountRepository);

  try {
    switch (event.method) {
      case "Transfer": {
        try {
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
    const savedAccount = await accountRepository.findOne({ where: { address: address.toString() } });
    if (savedAccount) {
      const query = Balance.createQueryBuilder("balance")
        .where(`balance.accountId =:accountId`, { accountId: savedAccount.accountId })
        .innerJoin(Block, "block", "block.blockId = balance.blockId")
        .orderBy("block.number", "DESC")
        .limit(1);

      const savedBalance = await query.getOne();
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
