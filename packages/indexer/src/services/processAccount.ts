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

export async function processAccount(ws: string, connection: Connection): Promise<void> {
  const api = await getApi(ws);

  MQ.getMQ().consume("account_indexer", (msg: ConsumeMessage, channel: Channel) => {
    const { address, blockId, blockHash, blockNumber } = JSON.parse(msg.content.toString());

    logger.info(`Processing account: ${address}, at block #${blockNumber}`);

    try {
      consume(api, connection, msg, channel, address, blockId, blockHash, blockNumber);
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
  address: GenericAccountId,
  blockId: number,
  blockHash: BlockHash,
  blockNumber?: BlockNumber
) {
  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const accountResult = await tryFetchAccount(api, address, blockHash, blockNumber);
    await saveAccount(connection, accountResult, blockId);

    console.time("commit");
    await queryRunner.commitTransaction();
    console.timeEnd("commit");

    channel.ack(msg);

    logger.info(`------Finished processing account: ${address.toString()} at block ${blockNumber.toNumber()}------`);
  } catch (error) {
    logger.error(error);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
  } finally {
    await queryRunner.release();
  }
}
