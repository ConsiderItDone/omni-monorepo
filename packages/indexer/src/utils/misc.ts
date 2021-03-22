import type { EventRecord, Event } from "@polkadot/types/interfaces/system";
import type { GenericExtrinsic, Vec } from "@polkadot/types";
import {
  ExtrinsicWithBoundedEvents,
  Application as ApplicationType,
} from "./types";
import { getCustomRepository } from "typeorm";
import { ApplicationRepository } from "../repositories";
import { Application as ApplicationModel } from "../models";

// Bounding events to Extrinsics with 'phase.asApplyExtrinsic.eq(----))'
export function boundEventsToExtrinsics(
  extrinsics: Vec<GenericExtrinsic>,
  events: Vec<EventRecord>
): ExtrinsicWithBoundedEvents[] {
  return extrinsics.map(({ hash }, index) => {
    const boundedEvents: Event[] = events
      .filter(
        ({ phase }: EventRecord) =>
          phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
      )
      .map(({ event }: EventRecord) => event);

    return { hash: hash.toHex(), boundedEvents };
  });
}
export function findExtrinsicsWithEventsHash(
  extrinsicsWithBoundedEvents: ExtrinsicWithBoundedEvents[],
  eventRecord: EventRecord
): string | null {
  return (
    extrinsicsWithBoundedEvents.find((extrinsic) =>
      extrinsic.boundedEvents.some(
        (event) => event.hash.toHex() === eventRecord.event.hash.toHex()
      )
    )?.hash || null
  );
}
export function getExtrinsicSuccess(
  extrinsic: GenericExtrinsic,
  extrinsicsWithBoundedEvents: ExtrinsicWithBoundedEvents[]
  //extrinsicIndex: number,
  //events: EventRecord[],
  //api: ApiPromise
): boolean {
  const extr = extrinsicsWithBoundedEvents.find(
    (e) => e.hash === extrinsic.hash.toHex()
  );
  return extr.boundedEvents.some(
    (event) => event.method === "ExtrinsicSuccess"
  ); // !!! DANGER ZONE

  /* return events  // TODO find a new way to find extrinsic success
      .filter(
        ({ phase }: EventRecord) =>
          phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(extrinsicIndex)
      )
      .some(({ event }: EventRecord) => api.events.system.ExtrinsicSuccess.is(event)); */
}

/******************* Application utils *************************************/
export async function addOrReplaceApplication(
  accountId: string,
  applicationData: ApplicationType,
  blockId: number,
  status?: string
) {
  const applicationRepository = getCustomRepository(ApplicationRepository);
  const existingApplication = await applicationRepository.findCandidate(
    accountId
  );
  const unpackedApplicationData = unpackApplicationData(
    blockId,
    applicationData,
    status
  );
  if (existingApplication) {
    await applicationRepository.replace({
      applicationId: existingApplication.applicationId,
      ...unpackedApplicationData,
    });
  } else {
    await applicationRepository.add(unpackedApplicationData);
  }
}
function unpackApplicationData(
  blockId: number,
  application: ApplicationType,
  status?: string
): ApplicationModel {
  const {
    candidate,
    candidate_deposit,
    metadata,
    challenger,
    challenger_deposit,
    votes_for,
    voters_for,
    votes_against,
    voters_against,
    created_block,
    challenged_block,
  } = application;

  return {
    blockId,
    status,
    candidate: candidate.toString(),
    candidateDeposit: candidate_deposit.toNumber(),
    metadata: metadata.toString(),
    challenger: challenger.unwrapOr(null),
    challengerDeposit:
      challenger_deposit.unwrapOr(null) &&
      challenger_deposit.unwrap().toNumber(),
    votesFor: votes_for.unwrapOr(null) && votes_for.unwrap().toString(),
    votersFor: voters_for.map((v) => JSON.stringify(v)),
    votesAgainst:
      votes_against.unwrapOr(null) && votes_against.unwrap().toString(),
    votersAgainst: voters_against.map((v) => JSON.stringify(v)),
    createdBlock: created_block.toString(),
    challengedBlock: challenged_block.toString(),
  } as ApplicationModel;
}
