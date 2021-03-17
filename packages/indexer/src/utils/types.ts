import type { Event } from "@polkadot/types/interfaces/system";
import type { Vec } from "@polkadot/types";

export type ExtrinsicWithBoundedEvents = { hash: string; boundedEvents: Event[] };

export enum CustomExtrinsicSection {
    RootOfTrust = "pkiRootOfTrust",
    VestingSchedule = "grants",
  }