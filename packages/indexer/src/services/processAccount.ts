import type { BlockHash } from "@polkadot/types/interfaces/chain";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { GenericAccountId } from "@polkadot/types";
import { ApiPromise } from "@polkadot/api";
import { ConsumeMessage } from "amqplib/properties";
import { Channel } from "amqplib";
import { Connection } from "typeorm";

import MQ from "@nodle/utils/src/mq";
import { logger } from "@nodle/utils/src/logger";
import { getApi } from "@nodle/polkadot/src/api";
import { saveAccount, tryFetchAccount } from "@nodle/polkadot/src/misc";

import { Account as AccountModel, Balance as BalanceModel } from "@nodle/db/src/models";
import AccountRepository from "@nodle/db/src/repositories/public/accountRepository";

interface AccountBlockData {
  address: string | GenericAccountId;
  blockId: number;
  blockHash: BlockHash;
  blockNumber?: BlockNumber;
}
export async function processAccount(ws: string, connection: Connection): Promise<void> {
  const api = await getApi(ws);

  MQ.getMQ().consume("account_indexer", (msg: ConsumeMessage, channel: Channel) => {
    const { address, blockId, blockHash, blockNumber } = JSON.parse(msg.content.toString());

    logger.info(`Processing account: ${address}, at block #${blockNumber}`);

    try {
      consume(api, connection, msg, channel, { address, blockId, blockHash, blockNumber });
    } catch (error) {
      logger.error(error);
      channel.ack(msg);
    }
  });
}

async function consume(
  api: ApiPromise,
  connection: Connection,
  msg: ConsumeMessage,
  channel: Channel,
  data: AccountBlockData
) {
  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { savedAccount, savedBalance } = await handleAccountBalance(api, connection, data);
    console.time("commit");
    await queryRunner.commitTransaction();
    console.timeEnd("commit");

    channel.ack(msg);

    logger.info(
      `------Finished processing account: ${data.address.toString()} at block ${data.blockNumber.toNumber()}------`
    );

    MQ.getMQ().emit("newBalance", {
      ...savedBalance,
      address: savedAccount.address,
    });
  } catch (error) {
    logger.error(error);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
  } finally {
    await queryRunner.release();
  }
}

async function handleAccountBalance(
  api: ApiPromise,
  connection: Connection,
  { address, blockId, blockHash, blockNumber }: AccountBlockData
) {
  const accountRepository = connection.getCustomRepository(AccountRepository);

  const savedAccount = await accountRepository.findOne({ where: { address: address.toString() } });

  if (savedAccount) {
    const savedBalance = await BalanceModel.createQueryBuilder("balance")
      .innerJoinAndSelect("balance.block", "block")
      .where(`balance.accountId =:accountId`, { accountId: savedAccount.accountId })
      .orderBy("block.number", "DESC", "NULLS LAST")
      .limit(1)
      .getOne();

    if (savedBalance) {
      const isOldBalance = Number(savedBalance?.block?.number) < blockNumber.toNumber();
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
    return await saveAccount(connection, account, blockId, options);
  }
}
