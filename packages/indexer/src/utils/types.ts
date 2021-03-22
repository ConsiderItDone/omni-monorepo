import type { Event } from "@polkadot/types/interfaces/system";
import type { Vec, Option } from "@polkadot/types";
import {
  Balance,
  BlockNumber,
  AccountId,
} from "@polkadot/types/interfaces/runtime";
import { u32, u8 } from "@polkadot/types";
import { ITuple } from "@polkadot/types/types";

export type ExtrinsicWithBoundedEvents = {
  hash: string;
  boundedEvents: Event[];
};

export enum CustomEventSection {
  RootOfTrust = "pkiRootOfTrust",
  VestingSchedule = "grants",
  Application = "pkiTcr",
}

export type Application = {
  candidate: AccountId;
  candidate_deposit: Balance;
  metadata: Vec<u8>;
  challenger: Option<AccountId>;
  challenger_deposit: Option<Balance>;
  votes_for: Option<Balance>;
  voters_for: Vec<ITuple<[AccountId, Balance]>>;
  votes_against: Option<Balance>;
  voters_against: Vec<ITuple<[AccountId, Balance]>>;
  created_block: BlockNumber;
  challenged_block: BlockNumber;
};

export enum ApplicationStatus {
  pending = "application",
  accepted = "member",
}

export type VestingScheduleOf = {
  start: BlockNumber;
  period: BlockNumber;
  period_count: u32;
  per_period: Balance;
};
