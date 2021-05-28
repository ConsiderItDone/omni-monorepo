import { ApiPromise } from "@polkadot/api";
import { EntityManager } from "typeorm";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";

import { upsertRootCertificate } from "@nodle/polkadot/src/misc";
import { RootCertificate } from "@nodle/utils/src/types";
import { logger, LOGGER_INFO_CONST, LOGGER_ERROR_CONST } from "@nodle/utils/src/logger";

export async function handleRootOfTrust(
  manager: EntityManager,
  event: Event,
  api: ApiPromise,
  blockId: number,
  blockNumber: BlockNumber
): Promise<void> {
  try {
    logger.info(LOGGER_INFO_CONST.ROOT_OF_TRUST_RECEIVED(blockNumber.toNumber()));

    let certificateId = event?.data[0]?.toString() || "";
    switch (event.method) {
      case "SlotTaken":
        certificateId = event.data[1].toString();
        break;
      //case "SlotRenewed":
      //case "SlotRevoked":
      //case "ChildSlotRevoked":
      default:
        break;
    }
    let certificateData: RootCertificate;
    try {
      certificateData = ((await api.query.pkiRootOfTrust.slots(certificateId)) as undefined) as RootCertificate;
    } catch (fetchError) {
      logger.error(LOGGER_ERROR_CONST.ROOT_CERTIFICATE_FETCH_ERROR(certificateId), fetchError);
    }
    try {
      await upsertRootCertificate(manager, certificateId, certificateData, blockId);
    } catch (upsertingError) {
      logger.error(LOGGER_ERROR_CONST.ROOT_CERTIFICATE_UPSERT_ERROR(blockNumber.toNumber()), upsertingError);
    }
  } catch (error) {
    logger.error(error);
  }
}
