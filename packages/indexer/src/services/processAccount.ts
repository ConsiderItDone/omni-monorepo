import { ApiPromise } from "@polkadot/api";
import { ConsumeMessage } from "amqplib/properties";
import { Channel } from "amqplib";
import { Connection } from "typeorm";
import { TypeRegistry } from "@polkadot/types/create";

import { MQ } from "@nodle/utils";
import { logger as Logger } from "@nodle/utils";
const { logger } = Logger;
import { getApi, handleAccountBalance } from "@nodle/polkadot";
import { AccountBlockData } from "@nodle/utils";
import { BlockRepository } from "@nodle/db";

export async function processAccount(ws: string, connection: Connection): Promise<void> {
  const api = await getApi(ws);

  MQ.getMQ().consume("account_indexer", (msg: ConsumeMessage, channel: Channel) => {
    const parsed: AccountBlockData = JSON.parse(msg.content.toString());
    console.log("parsed", parsed);
    const { address, blockId, blockHash, blockNumber } = parsed;

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
    const blockRepository = queryRunner.manager.getCustomRepository(BlockRepository);
    const blockDB = await blockRepository.findByNumber(data.blockNumber);
    if (blockDB?.hash) {
      const registry = new TypeRegistry();
      data.blockHash = registry.createType("BlockHash", blockDB.hash);
    }
    const { savedAccount, savedBalance } = await handleAccountBalance(api, connection, data);
    console.time("commit");
    await queryRunner.commitTransaction();
    console.timeEnd("commit");

    channel.ack(msg);

    logger.info(`------Finished processing account: ${data.address.toString()} at block ${data.blockNumber}------`);

    MQ.getMQ().emit("newBalance", {
      ...savedBalance,
      address: savedAccount.address,
    });
  } catch (error) {
    logger.error(error?.message);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
  } finally {
    await queryRunner.release();
  }
}
