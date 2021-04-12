import { ApiPromise } from "@polkadot/api";
import { Connection } from "typeorm";
import type {
  Header,
  DigestItem,
  Moment,
  BlockNumber,
} from "@polkadot/types/interfaces/runtime";
import type { EventRecord, Event } from "@polkadot/types/interfaces/system";
import type { GenericExtrinsic, Vec } from "@polkadot/types";
import type { BlockHash } from "@polkadot/types/interfaces/chain";
import { u8aToHex } from "@polkadot/util";
import { AccountInfo } from "@polkadot/types/interfaces/system";

import BlockRepository from "@nodle/db/src/repositories/public/blockRepository";
import EventRepository from "@nodle/db/src/repositories/public/eventRepository";
import ExtrinsicRepository from "@nodle/db/src/repositories/public/extrinsicRepository";
import LogRepository from "@nodle/db/src/repositories/public/logRepository";
import VestingScheduleRepository from "@nodle/db/src/repositories/public/vestingScheduleRepository";

import {
  findExtrinsicsWithEventsHash,
  getExtrinsicSuccess,
  upsertApplication,
  changeApplicationStatus,
  upsertRootCertificate,
  applicationIsEmpty,
  boundEventsToExtrinsics,
  saveAccount,
  transformEventData,
  tryFetchApplication,
  ApplicationFetchMethods,
  tryFetchAccount,
} from "./misc";

import {
  ExtrinsicWithBoundedEvents,
  CustomEventSection,
  VestingScheduleOf,
  Application as ApplicationType,
  ApplicationStatus,
  RootCertificate,
} from "@nodle/utils/src/types";

import {GenericAccountId} from "@polkadot/types";
import {
  logger,
  LOGGER_INFO_CONST,
  LOGGER_ERROR_CONST,
} from "@nodle/utils/src/logger";

import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import Log from "@nodle/db/src/models/public/log";
import Block from "@nodle/db/src/models/public/block";
import { default as EventModel } from "@nodle/db/src/models/public/event";
import ApplicationRepository from "@nodle/db/src/repositories/public/applicationRepository";

/******************** BASE HANDLERS **********************/

export async function handleNewBlock(
  connection: Connection,
  blockHeader: Header,
  timestamp: Moment,
  specVersion: number
): Promise<Block> {
  try {
    logger.info(
      LOGGER_INFO_CONST.BLOCK_RECEIVED(blockHeader.number.toNumber())
    );

    const blockRepository = connection.getCustomRepository(BlockRepository);

    const { parentHash, number, stateRoot, extrinsicsRoot, hash } = blockHeader;
    try {
      const block = await blockRepository.add({
        number: number.toString(),
        timestamp: new Date(timestamp.toNumber()),
        hash: hash.toHex(),
        parentHash: parentHash.toString(),
        stateRoot: u8aToHex(stateRoot),
        extrinsicsRoot: u8aToHex(extrinsicsRoot),
        specVersion,
        finalized: false,
      });

      logger.info(
        LOGGER_INFO_CONST.BLOCK_SAVED({
          blockId: block.blockId,
          blockNumber: number.toNumber(),
        })
      );

      return block;
    } catch (blockSaveError) {
      logger.error(
        LOGGER_ERROR_CONST.BLOCK_SAVE_ERROR(number.toNumber()),
        blockSaveError
      );
    }
  } catch (error) {
    logger.error(error);
  }
}

export async function handleEvents(
  connection: Connection,
  events: Vec<EventRecord>,
  extrinsicsWithBoundedEvents: ExtrinsicWithBoundedEvents[],
  blockId: number,
  blockNumber: BlockNumber
): Promise<[EventModel[], Event[]]> {
  try {
    logger.info(
      LOGGER_INFO_CONST.EVENTS_RECEIVED(events.length, blockNumber?.toNumber())
    );

    const eventRepository = connection.getCustomRepository(EventRepository);
    const extrinsicRepository = connection.getCustomRepository(
      ExtrinsicRepository
    );

    const trackedEvents: Event[] = [];
    const newEvents: EventModel[] = [];

    for (const [index, eventRecord] of events.entries()) {
      const { method, section, data } = eventRecord.event;
      if (
        (Object.values(CustomEventSection) as string[]).includes(
          eventRecord.event.section
        )
      ) {
        trackedEvents.push(eventRecord.event);
      }
      const extrinsicHash = findExtrinsicsWithEventsHash(
        extrinsicsWithBoundedEvents,
        eventRecord
      );
      const extrinsic = await extrinsicRepository.findByHash(extrinsicHash);
      try {
        const event = await eventRepository.add({
          index,
          data: transformEventData(method, data),
          extrinsicHash,
          extrinsicId: extrinsic?.extrinsicId || null,
          moduleName: section,
          eventName: method,
          blockId,
        });
        newEvents.push(event);
      } catch (eventSaveError) {
        logger.error(
          LOGGER_ERROR_CONST.EVENT_SAVE_ERROR(
            `${section}.${method}`,
            blockNumber.toNumber()
          ),
          eventSaveError
        );
      }
    }
    logger.info(
      LOGGER_INFO_CONST.EVENTS_SAVED({
        blockId,
        blockNumber: blockNumber.toNumber(),
        length: events.length,
        savedLength: newEvents.length,
      })
    );

    return [newEvents, trackedEvents];
  } catch (error) {
    logger.error(error);
  }
}

export async function handleLogs(
  connection: Connection,
  logs: Vec<DigestItem>,
  blockId: number,
  blockNumber: BlockNumber
): Promise<Log[]> {
  try {
    logger.info(
      LOGGER_INFO_CONST.LOGS_RECEIVED(logs.length, blockNumber?.toNumber())
    );
    const logRepository = connection.getCustomRepository(LogRepository);

    try {
      const newLogs = await logRepository.addList(
        logs.map((log: DigestItem, index: number) => {
          const { type, value } = log;
          return {
            index: `${blockId}-${index}`,
            type,
            data: value.toHuman().toString().split(",")[1], // value is always ['BABE':u32, hash:Bytes]
            isFinalized: false, // TODO finalized what ? suggestion is 'preruntime' === false, seal === true
            blockId,
          };
        })
      );

      logger.info(
        LOGGER_INFO_CONST.LOGS_SAVED({
          blockId,
          blockNumber: blockNumber.toNumber(),
          length: logs.length,
          savedLength: newLogs.length,
        })
      );

      return newLogs;
    } catch (logsSaveError) {
      logger.error(
        LOGGER_ERROR_CONST.LOGS_SAVE_ERROR(blockNumber?.toNumber()),
        logsSaveError
      );
    }
  } catch (error) {
    logger.error(error);
  }
}

export async function handleExtrinsics(
  connection: Connection,
  extrinsics: Vec<GenericExtrinsic>,
  events: Vec<EventRecord>,
  blockId: number,
  blockNumber: BlockNumber
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

    const extrinsicRepository = connection.getCustomRepository(
      ExtrinsicRepository
    );

    const processedExtrinsics = extrinsics.map(
      (extrinsic: GenericExtrinsic, index: number) => {
        return {
          index,
          length: extrinsic.length,
          versionInfo: extrinsic.version.toString(),
          callCode: `${extrinsic.method.section.toString()}.${extrinsic.method.method.toString()}`, // extrinsic.callIndex [0, 1] ??
          callModule: extrinsic.method.section,
          callModuleFunction: extrinsic.method.method,
          params: JSON.stringify(extrinsic.method.args), // TODO changed after downgrade
          nonce: extrinsic.nonce.toNumber(),
          era: extrinsic.era.toString(),
          hash: extrinsic.hash.toHex(),
          isSigned: extrinsic.isSigned,
          signature: extrinsic.isSigned ? extrinsic.signature.toString() : null,
          success: getExtrinsicSuccess(extrinsic, extrinsicsWithBoundedEvents),
          signer: extrinsic.isSigned ? extrinsic.signer.toString() : null,
          blockId,
        };
      }
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

/******************** CUSTOM EVENTS HANDLERS **********************/

export async function handleTrackedEvents(
  connection: Connection,
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
    logger.info(
      LOGGER_INFO_CONST.CUSTOM_EVENTS_RECEIVED(
        trackedEvents.length,
        blockNumber?.toNumber()
      )
    );
    for (const event of trackedEvents) {
      switch (event.section) {
        case CustomEventSection.RootOfTrust:
          handleRootOfTrust(connection, event, api, blockId, blockNumber);
          break;
        case CustomEventSection.VestingSchedule:
          handleVestingSchedule(connection, event, blockId, api, blockNumber);
          break;
        case CustomEventSection.Application:
          handleApplication(connection, event, blockId, api, blockNumber);
          break;
        case CustomEventSection.Balance:
          handleBalance(
            connection,
            event,
            blockId,
            api,
            blockHash,
            blockNumber
          );
          break;
        default:
          return;
      }
    }
  } catch (error) {
    logger.error(error);
  }
}

async function handleRootOfTrust(
  connection: Connection,
  event: Event,
  api: ApiPromise,
  blockId: number,
  blockNumber: BlockNumber
) {
  try {
    logger.info(
      LOGGER_INFO_CONST.ROOT_OF_TRUST_RECEIVED(blockNumber.toNumber())
    );

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
      certificateData = ((await api.query.pkiRootOfTrust.slots(
        certificateId
      )) as undefined) as RootCertificate;
    } catch (fetchError) {
      logger.error(
        LOGGER_ERROR_CONST.ROOT_CERTIFICATE_FETCH_ERROR(certificateId),
        fetchError
      );
    }
    try {
      await upsertRootCertificate(
        connection,
        certificateId,
        certificateData,
        blockId
      );
    } catch (upsertingError) {
      logger.error(
        LOGGER_ERROR_CONST.ROOT_CERTIFICATE_UPSERT_ERROR(
          blockNumber.toNumber()
        ),
        upsertingError
      );
    }
  } catch (error) {
    logger.error(error);
  }
}

async function handleVestingSchedule(
  connection: Connection,
  event: Event,
  blockId: number,
  api: ApiPromise,
  blockNumber: BlockNumber
) {
  try {
    let targetAccount: string = event.data[0].toString(); // default
    const vestingScheduleRepository = connection.getCustomRepository(
      VestingScheduleRepository
    );

    switch (event.method) {
      case "VestingScheduleAdded": {
        targetAccount = event.data[1].toString();
        // const vestingScheduleData = (event.data[2] as undefined) as VestingScheduleOf;
        break;
      }
      case "VestingSchedulesCanceled": {
        // await vestingScheduleRepository.cancelSchedules(targetAccount);
        break;
      }
      case "Claimed":
      default:
        return;
    }
    let grants: VestingScheduleOf[];
    try {
      grants = ((await api.query.grants.vestingSchedules(
        targetAccount
      )) as undefined) as VestingScheduleOf[];
    } catch (grantsFetchError) {
      logger.error(
        LOGGER_ERROR_CONST.VESTING_SCHEDULE_FETCH_ERROR(
          targetAccount,
          blockNumber.toNumber()
        ),
        grantsFetchError
      );
    }

    if (grants) {
      await vestingScheduleRepository.removeSchedulesByAccount(targetAccount);

      for (const grant of grants) {
        const { start, period, period_count, per_period } = grant;
        try {
          await vestingScheduleRepository.add({
            accountAddress: targetAccount,
            start: start.toString(),
            period: period.toString(),
            periodCount: period_count.toNumber(),
            perPeriod: per_period.toString(),
            blockId,
            status: "active",
          });
        } catch (grantSaveError) {
          logger.error(
            LOGGER_ERROR_CONST.VESTING_SCHEDULE_SAVE_ERROR(
              targetAccount,
              blockNumber.toNumber()
            ),
            grantSaveError
          );
        }
      }
    }
  } catch (error) {
    logger.error(error);
  }
}

async function handleApplication(
  connection: Connection,
  event: Event,
  blockId: number,
  api: ApiPromise,
  blockNumber: BlockNumber
) {
  try {
    const accountAddress = event.data[0].toString(); // may be reassigned
    let applicationData;
    let applicationStatus = ApplicationStatus.pending;

    switch (event.method) {
      case "NewApplication": {
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Applications,
          accountAddress,
          blockNumber
        );
        applicationStatus = ApplicationStatus.pending;
        break;
      }
      case "ApplicationPassed": {
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Members,
          accountAddress,
          blockNumber
        );
        applicationStatus = ApplicationStatus.accepted;
        break;
      }
      case "ApplicationChallenged": {
        //const challengedAcc = event.data[0].toString();
        //const challengerAcc = event.data[1].toString();
        //const challengerDeposit = event.data[2] as Balance;
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountAddress,
          blockNumber
        );
        applicationStatus = ApplicationStatus.challenged;
        //addChallenger(challengedAcc,challengerAcc,challengerDeposit.toNumber(),blockId,challengedAppData);
        break;
      }
      case "ApplicationCountered": {
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountAddress,
          blockNumber
        );
        applicationStatus = ApplicationStatus.countered;
        break;
      }
      case "VoteRecorded": {
        //const voteTarget = event.data[0].toString();
        //const voteInitiator = event.data[1];
        //const voteValue = event.data[3].toHuman() as boolean;
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountAddress,
          blockNumber
        );
        applicationStatus = ApplicationStatus.challenged;
        // recordVote(connection,voteInitiator,voteTarget,voteValue,blockId,targetData);
        break;
      }
      /* 
    /// A challenge killed the given application ChallengeRefusedApplication(AccountId),
    case "ChallengeRefusedApplication": {
      const acc = event.data[0];
      break;
    }
    /// A challenge accepted the application  ChallengeAcceptedApplication(AccountId),
    case "ChallengeAcceptedApplication": {
      const acc = event.data[0];
      break;
    } 
    */
      default:
        return;
    }
    try {
      await upsertApplication(
        connection,
        accountAddress,
        (applicationData as undefined) as ApplicationType,
        blockId,
        applicationStatus
      );
    } catch (applicationUpsertError) {
      logger.error(
        LOGGER_ERROR_CONST.APPLICATION_UPSERT_ERROR(
          accountAddress,
          blockNumber.toNumber()
        ),
        applicationUpsertError
      );
    }
  } catch (error) {
    logger.error(error);
  }
}
async function handleBalance(
  connection: Connection,
  event: Event,
  blockId: number,
  api: ApiPromise,
  blockHash: BlockHash,
  blockNumber: BlockNumber
): Promise<void> {
  try {
    switch (event.method) {
      case "Transfer": {
        const accFrom = [
          event.data[0],
          await tryFetchAccount(
            api,
            event.data[0] as GenericAccountId,
            blockHash,
            blockNumber
          ),
        ];
        const accTo = [
          event.data[1],
          await tryFetchAccount(
            api,
            event.data[1] as GenericAccountId,
            blockHash,
            blockNumber
          ),
        ];
        try {
          saveAccount(
            connection,
            accFrom[0] as GenericAccountId,
            accFrom[1] as AccountInfo,
            blockId
          );
          saveAccount(
            connection,
            accTo[0] as GenericAccountId,
            accTo[1] as AccountInfo,
            blockId
          );
        } catch (accountSaveError) {
          logger.error(
            LOGGER_ERROR_CONST.ACCOUNT_SAVE_ERROR(blockNumber.toNumber()),
            accountSaveError
          );
        }
        break;
      }
      default:
        return;
    }
  } catch (error) {
    logger.error(error);
  }
}
/******************** BACKFILL CUSTOM EVENTS **********************/

export async function backfillTrackedEvents(
  connection: Connection,
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
    for (const event of trackedEvents) {
      switch (event.section) {
        case CustomEventSection.RootOfTrust:
          handleRootOfTrust(connection, event, api, blockId, blockNumber);
          break;
        case CustomEventSection.VestingSchedule:
          handleVestingSchedule(connection, event, blockId, api, blockNumber);
          break;
        case CustomEventSection.Application:
          backfillApplication(connection, event, blockId, api, blockNumber);
          break;
        case CustomEventSection.Balance:
          handleBalance(
            connection,
            event,
            blockId,
            api,
            blockHash,
            blockNumber
          );
          break;
        default:
          return;
      }
    }
  } catch (error) {
    logger.error(error);
  }
}

async function backfillApplication(
  connection: Connection,
  event: Event,
  blockId: number,
  api: ApiPromise,
  blockNumber: BlockNumber
) {
  try {
    const accountId = event.data[0].toString();
    let applicationData: ApplicationType;
    let applicationStatus = ApplicationStatus.pending;
    const applicationRepository = connection.getCustomRepository(
      ApplicationRepository
    );
    switch (event.method) {
      case "NewApplication": {
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Applications,
          accountId,
          blockNumber
        );
        if (applicationIsEmpty(applicationData)) return;
        const existingApplication = await applicationRepository.findCandidate(
          accountId
        );
        if (existingApplication) return;
        break;
      }
      case "ApplicationPassed": {
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Members,
          accountId,
          blockNumber
        );

        if (applicationIsEmpty(applicationData)) return;

        const candidate = await applicationRepository.findOne({
          candidate: applicationData.candidate.toString(),
        });
        if (candidate) return;
        else applicationStatus = ApplicationStatus.accepted;
        break;
      }
      case "ApplicationCountered": {
        const counteredAcc = event.data[0].toString();
        const acceptedApplication = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountId,
          blockNumber
        );
        const existingApp = await applicationRepository.findCandidate(
          counteredAcc
        );
        if (!applicationIsEmpty(acceptedApplication)) return;
        if (existingApp.status === ApplicationStatus.pending) {
          changeApplicationStatus(
            connection,
            counteredAcc,
            ApplicationStatus.countered
          );
        }
        return;
      }
      case "ApplicationChallenged": {
        //const challengedAcc = event.data[0].toString();
        //const challengerAcc = event.data[1].toString();
        //const challengerDeposit = event.data[2] as Balance;
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountId,
          blockNumber
        );
        applicationStatus = ApplicationStatus.challenged;
        break;
      }
      case "VoteRecorded": {
        //const voteTarget = event.data[0] as AccountId;
        //const voteInitiator = event.data[1] as AccountId;
        //const voteValue = event.data[3].toHuman() as boolean;
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountId,
          blockNumber
        );
        applicationStatus = ApplicationStatus.challenged;
        break;
      }
      /* 
    /// A challenge killed the given application ChallengeRefusedApplication(AccountId),
    case "ChallengeRefusedApplication": {
      const acc = event.data[0];
      break;
    }
    /// A challenge accepted the application  ChallengeAcceptedApplication(AccountId),
    case "ChallengeAcceptedApplication": {
      const acc = event.data[0];
      break;
    } 
    */
      default:
        return;
    }
    await upsertApplication(
      connection,
      accountId,
      (applicationData as undefined) as ApplicationType,
      blockId,
      applicationStatus
    );
  } catch (error) {
    logger.error(error);
  }
}
