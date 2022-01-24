import { ApiPromise } from "@polkadot/api";
import { EntityManager } from "typeorm";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";

import { getOrCreateAccount, upsertRootCertificate } from "../misc";
import { RootCertificate } from "@nodle/utils/index";
import { logger as Logger } from "@nodle/utils/index";
const { logger, LOGGER_ERROR_CONST, LOGGER_INFO_CONST } = Logger;
import { BlockHash } from "@polkadot/types/interfaces/chain";

export async function handleRootOfTrust(
  manager: EntityManager,
  event: Event,
  api: ApiPromise,
  blockId: number,
  blockNumber: BlockNumber,
  blockHash: BlockHash
): Promise<void> {
  try {
    logger.info(LOGGER_INFO_CONST.ROOT_OF_TRUST_RECEIVED(blockNumber.toNumber()));

    let certificateAddress = event?.data[0]?.toString() || "";
    switch (event.method) {
      case "SlotTaken":
        certificateAddress = event.data[1].toString();
        break;
      //case "SlotRenewed":
      //case "SlotRevoked":
      //case "ChildSlotRevoked":
      default:
        break;
    }
    let certificateData: RootCertificate;
    try {
      certificateData = ((await api.query.pkiRootOfTrust.slots(certificateAddress)) as undefined) as RootCertificate;
    } catch (fetchError) {
      logger.error(LOGGER_ERROR_CONST.ROOT_CERTIFICATE_FETCH_ERROR(certificateAddress), fetchError);
    }
    try {
      const certificate = await getOrCreateAccount(api, manager, certificateAddress, blockHash, blockNumber, blockId);

      await upsertRootCertificate(
        api,
        manager,
        certificate.accountId,
        certificateData,
        blockHash,
        blockNumber,
        blockId
      );
    } catch (upsertingError) {
      logger.error(LOGGER_ERROR_CONST.ROOT_CERTIFICATE_UPSERT_ERROR(blockNumber.toNumber()), upsertingError);
    }
  } catch (error) {
    logger.error(error);
  }
}
