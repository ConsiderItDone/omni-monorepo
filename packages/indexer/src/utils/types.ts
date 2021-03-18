import type { Event } from "@polkadot/types/interfaces/system";
import type { Vec, Option } from "@polkadot/types";
import U32 from "@polkadot/types/primitive/U32";
import U8 from "@polkadot/types/primitive/U8";
import {
  Balance,
  BlockNumber,
  AccountId,
} from "@polkadot/types/interfaces/runtime";

export type ExtrinsicWithBoundedEvents = {
  hash: string;
  boundedEvents: Event[];
};

export enum CustomExtrinsicSection {
  RootOfTrust = "pkiRootOfTrust",
  VestingSchedule = "grants",
  Application = "pkiTcr",
}

export type Application = {
  candidate: AccountId;
  candidate_deposit: Balance;
  metadata: Vec<U8>; // u8
  challenger: Option<AccountId>;
  challenger_deposit: Option<Balance>;
  votes_for: Option<Balance>;
  voters_for: any; //Vec<(AccountId, Balance)>,
  votes_against: Option<Balance>;
  voters_against: any; //Vec<(AccountId, Balance)>,
  created_block: BlockNumber;
  challenged_block: BlockNumber;
};

export type VestingScheduleOf = {
  start: BlockNumber;
  period: BlockNumber;
  period_count: U32; // "u32"
  per_period: Balance;
};
