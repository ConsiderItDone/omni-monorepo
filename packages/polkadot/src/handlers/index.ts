import { ApiPromise } from "@polkadot/api";
import { Connection, EntityManager } from "typeorm";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";
import type { BlockHash } from "@polkadot/types/interfaces/chain";
import { types, logger as Logger, AccountBlockData } from "@nodle/utils";
const { logger, LOGGER_INFO_CONST } = Logger;
const { CustomEventSection } = types;

import { Account, Balance, AccountRepository, BlockRepository } from "@nodle/db";

import { handleApplication } from "./applicationHandler";
import { handleBalance } from "./balanceHandler";
import { handleRootOfTrust } from "./rootOfTrustHandler";
import { handleVestingSchedule } from "./vestingScheduleHandler";
import { handleAllocation } from "./allocationHandler";
import { tryFetchAccount, saveAccount, IAccount } from "../misc";

export async function handleTrackedEvents(
  manager: EntityManager,
  trackedEvents: Event[],
  api: ApiPromise,
  blockId: number,
  blockHash: BlockHash,
  blockNumber: BlockNumber
): Promise<void> {
  try {
    if (trackedEvents.length < 1) {
      return;
    }
    logger.info(LOGGER_INFO_CONST.CUSTOM_EVENTS_RECEIVED(trackedEvents.length, blockNumber?.toNumber()));
    for (const event of trackedEvents) {
      switch (event.section) {
        case CustomEventSection.RootOfTrust:
          await handleRootOfTrust(manager, event, api, blockId, blockNumber, blockHash);
          break;
        case CustomEventSection.VestingSchedule:
          await handleVestingSchedule(manager, event, blockId, api, blockNumber, blockHash);
          break;
        case CustomEventSection.Application:
          await handleApplication(manager, event, blockId, api, blockNumber, blockHash);
          break;
        case CustomEventSection.Balance: {
          await handleBalance(event, blockId, blockHash, blockNumber);
          break;
        }
        case CustomEventSection.Allocation:
          await handleAllocation(event, blockId, blockHash, blockNumber);
          break;
        default:
          return;
      }
    }
  } catch (error) {
    logger.error(error);
  }
}

export async function handleAccountBalance(
  api: ApiPromise,
  connection: Connection,
  { address, blockHash, blockNumber }: AccountBlockData,
  prefetched?: IAccount
): Promise<{ savedAccount: Account; savedBalance?: Balance }> {
  const accountRepository = connection.getCustomRepository(AccountRepository);
  const blockRepository = connection.getCustomRepository(BlockRepository);

  const savedAccount = await accountRepository.findByAddress(address.toString());
  const block = await blockRepository.findByNumber(blockNumber);

  if (savedAccount) {
    const savedBalance = await Balance.createQueryBuilder("balance")
      .innerJoinAndSelect("balance.block", "block")
      .where(`balance.accountId =:accountId`, { accountId: savedAccount.accountId })
      .orderBy("block.number", "DESC", "NULLS LAST")
      .limit(1)
      .getOne();

    if (savedBalance) {
      const isOldBalance = Number(savedBalance?.block?.number) < blockNumber;
      if (isOldBalance) {
        return await saveAccountBalance({ accountId: savedAccount.accountId, balanceId: savedBalance.balanceId });
      }
      return { savedAccount, savedBalance };
    }
    return await saveAccountBalance({ accountId: savedAccount.accountId });
  }
  return await saveAccountBalance();

  async function saveAccountBalance(options?: { accountId?: number; balanceId?: number }) {
    const account = prefetched || (await tryFetchAccount(api, address, blockHash, blockNumber));
    return await saveAccount(connection, account, block.blockId, options);
  }
}

export { handleNewBlock, handleBlockReorg } from "./blockHandler";
export { handleEvents } from "./eventHandler";
export { handleExtrinsics } from "./extrinsicHandler";
export { handleLogs } from "./logHandler";
export { handleApplication, handleBalance, handleRootOfTrust, handleVestingSchedule };
