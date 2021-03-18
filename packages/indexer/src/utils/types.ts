import type { Event } from "@polkadot/types/interfaces/system";
import type { Vec } from "@polkadot/types";
import U32 from "@polkadot/types/primitive/U32";
import { Balance, BlockNumber } from '@polkadot/types/interfaces/runtime';

export type ExtrinsicWithBoundedEvents = {
  hash: string;
  boundedEvents: Event[];
};

export enum CustomExtrinsicSection {
  RootOfTrust = "pkiRootOfTrust",
  VestingSchedule = "grants",
  Application = "pkiTcr"
}

export type VestingScheduleOf = {
  start: BlockNumber;
  period: BlockNumber;
  period_count: U32; // "u32"
  per_period: Balance;
};
