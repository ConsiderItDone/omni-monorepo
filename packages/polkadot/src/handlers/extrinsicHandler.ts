import { EntityManager } from "typeorm";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { EventRecord } from "@polkadot/types/interfaces/system";
import type { GenericExtrinsic, Vec } from "@polkadot/types";

import ExtrinsicRepository from "@nodle/db/src/repositories/public/extrinsicRepository";
import {
  getExtrinsicSuccess,
  boundEventsToExtrinsics,
  getOrCreateAccount,
} from "@nodle/polkadot/src/misc";
import { ExtrinsicWithBoundedEvents } from "@nodle/utils/src/types";
import {
  logger,
  LOGGER_INFO_CONST,
  LOGGER_ERROR_CONST,
} from "@nodle/utils/src/logger";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import { ApiPromise } from "@polkadot/api";
import { BlockHash } from "@polkadot/types/interfaces/chain";

export async function handleExtrinsics(
  manager: EntityManager,
  api: ApiPromise,
  extrinsics: Vec<GenericExtrinsic>,
  events: Vec<EventRecord>,
  blockId: number,
  blockNumber: BlockNumber,
  blockHash: BlockHash
): Promise<[Extrinsic[], ExtrinsicWithBoundedEvents[]]> {
  logger.info(
    LOGGER_INFO_CONST.EXTRINSICS_RECEIVED(
      extrinsics.length,
      blockNumber.toNumber()
    )
  );
  try {
    const extrinsicsWithBoundedEvents = boundEventsToExtrinsics(
      extrinsics,
      events
    );

    const extrinsicRepository = manager.getCustomRepository(
      ExtrinsicRepository
    );

    const processedExtrinsics = await Promise.all(
      extrinsics.map(async (extrinsic: GenericExtrinsic, index: number) => {
        const queryFeeDetails = await api.rpc.payment.queryFeeDetails(
          extrinsic.toHex(),
          blockHash
        );

        let signerId: number = null;
        if (extrinsic.isSigned) {
          const account = await getOrCreateAccount(
            api,
            manager,
            extrinsic.signer.toString(),
            blockHash,
            blockNumber,
            blockId
          );
          signerId = account.accountId;
        }

        return {
          index,
          length: extrinsic.length,
          versionInfo: extrinsic.version.toString(),
          callCode: `${extrinsic.method.section.toString()}.${extrinsic.method.method.toString()}`, // extrinsic.callIndex [0, 1] ??
          callModule: extrinsic.method.section,
          callModuleFunction: extrinsic.method.method,
          params: JSON.stringify(extrinsic.method.args),
          nonce: extrinsic.nonce.toNumber(),
          era: extrinsic.era.toString(),
          hash: extrinsic.hash.toHex(),
          fee: queryFeeDetails,
          isSigned: extrinsic.isSigned,
          signature: extrinsic.isSigned ? extrinsic.signature.toString() : null,
          success: getExtrinsicSuccess(extrinsic, extrinsicsWithBoundedEvents),
          signerId,
          blockId,
        };
      })
    );
    try {
      const newExtrinsics = await extrinsicRepository.addList(
        processedExtrinsics
      );
      logger.info(
        LOGGER_INFO_CONST.EXTRINSICS_SAVED({
          blockId,
          blockNumber: blockNumber.toNumber(),
          length: extrinsics.length,
          savedLength: newExtrinsics.length,
        })
      );
      return [newExtrinsics, extrinsicsWithBoundedEvents];
    } catch (extrinsicsSaveError) {
      logger.error(
        LOGGER_ERROR_CONST.EXTRINSICS_SAVE_ERROR(blockNumber?.toNumber()),
        extrinsicsSaveError
      );
    }
  } catch (error) {
    logger.error(error);
  }
}
