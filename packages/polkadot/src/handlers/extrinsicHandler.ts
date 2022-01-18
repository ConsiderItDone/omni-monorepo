import { EntityManager } from "typeorm";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { EventRecord } from "@polkadot/types/interfaces/system";
import type { GenericExtrinsic, Vec } from "@polkadot/types";

import ExtrinsicRepository from "@nodle/db/repositories/public/extrinsicRepository";
import ExtrinsicTypeRepository from "@nodle/db/repositories/public/extrinsicTypeRepository";
import ModuleRepository from "@nodle/db/repositories/public/moduleRepository";
import { getExtrinsicSuccess, boundEventsToExtrinsics, getOrCreateAccount } from "../misc";
import { ExtrinsicWithBoundedEvents } from "@nodle/utils/types";
import { logger, LOGGER_INFO_CONST, LOGGER_ERROR_CONST } from "@nodle/utils/logger";
import Module from "@nodle/db/models/public/module";
import Extrinsic from "@nodle/db/models/public/extrinsic";
import ExtrinsicType from "@nodle/db/models/public/extrinsicType";
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
  logger.info(LOGGER_INFO_CONST.EXTRINSICS_RECEIVED(extrinsics.length, blockNumber.toNumber()));
  try {
    const extrinsicsWithBoundedEvents = boundEventsToExtrinsics(extrinsics, events);

    const extrinsicRepository = manager.getCustomRepository(ExtrinsicRepository);

    const moduleRepository = manager.getCustomRepository(ModuleRepository);

    const extrinsicTypeRepository = manager.getCustomRepository(ExtrinsicTypeRepository);

    const processedExtrinsics = [];
    let index = 0;

    const moduleCache = new Map<string, Module>();
    const extrinsicTypeMap = new Map<string, ExtrinsicType>();

    for (const extrinsic of extrinsics) {
      const queryFeeDetails = await api.rpc.payment.queryFeeDetails(extrinsic.toHex(), blockHash);

      let signerId: number = null;
      if (extrinsic.isSigned) {
        const signerAddress = extrinsic.signer.toString();
        const account = await getOrCreateAccount(api, manager, signerAddress, blockHash, blockNumber, blockId);
        signerId = account.accountId;
      }

      let module: Module;
      // search in local cache
      if (moduleCache.has(extrinsic.method.section)) {
        module = moduleCache.get(extrinsic.method.section);
      } else {
        module = await moduleRepository.addOrIgnore({
          name: extrinsic.method.section,
        });
        moduleCache.set(extrinsic.method.section, module);
      }

      let extrinsicType: ExtrinsicType;
      const extrinsicTypeKey = `${extrinsic.method.method}-${module.moduleId}`;
      // search in local cache
      if (extrinsicTypeMap.has(extrinsicTypeKey)) {
        extrinsicType = extrinsicTypeMap.get(extrinsicTypeKey);
      } else {
        extrinsicType = await extrinsicTypeRepository.addOrIgnore({
          name: extrinsic.method.method,
          moduleId: module.moduleId,
        });
        extrinsicTypeMap.set(extrinsicTypeKey, extrinsicType);
      }

      processedExtrinsics.push({
        index,
        length: extrinsic.length,
        versionInfo: extrinsic.version.toString(),
        callCode: `${extrinsic.method.section.toString()}.${extrinsic.method.method.toString()}`, // extrinsic.callIndex [0, 1] ??
        moduleId: module.moduleId,
        extrinsicTypeId: extrinsicType.extrinsicTypeId,
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
      });

      index++;

      logger.info(`Processed extrinsic ${index}/${extrinsics.length} block #${blockNumber.toNumber()}`);
    }

    try {
      console.time("extrinsics save");
      const newExtrinsics = await extrinsicRepository.addList(processedExtrinsics);
      console.timeEnd("extrinsics save");

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
      logger.error(LOGGER_ERROR_CONST.EXTRINSICS_SAVE_ERROR(blockNumber?.toNumber()), extrinsicsSaveError);
    }
  } catch (error) {
    logger.error(error);
  }
}
