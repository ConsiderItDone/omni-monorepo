import { ApiPromise } from "@polkadot/api";
import { ConsumeMessage } from "amqplib/properties";
import { Channel } from "amqplib";
import { Connection } from "typeorm";

import MQ from "@nodle/utils/src/mq";
import { logger } from "@nodle/utils/src/logger";
import { getApi } from "@nodle/polkadot/src/api";
import { AccountBlockData } from "@nodle/utils/src/types";
import { handleAccountBalance } from "@nodle/polkadot/src/handlers";

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
    logger.error(error);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
  } finally {
    await queryRunner.release();
  }
}
