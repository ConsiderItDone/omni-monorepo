import type { Event } from "@polkadot/types/interfaces/system";
import type { Vec, Option, bool } from "@polkadot/types";
import { Balance, BlockNumber, AccountId } from "@polkadot/types/interfaces/runtime";
import { u32, u8, u128 } from "@polkadot/types";
import { ITuple } from "@polkadot/types/types";
import type { BlockHash } from "@polkadot/types/interfaces/chain";
import { GenericAccountId } from "@polkadot/types";

export type ExtrinsicWithBoundedEvents = {
  hash: string;
  boundedEvents: Event[];
};

export enum CustomEventSection {
  RootOfTrust = "pkiRootOfTrust",
  VestingSchedule = "grants",
  Application = "pkiTcr",
  Balance = "balances",
  Allocation = "allocations",
  CompanyReserve = "companyReserve",
}

export type CertificateId = AccountId;

export type Application = {
  candidate: AccountId;
  candidate_deposit: Balance;
  metadata: Vec<u8>;
  challenger: Option<AccountId>;
  challenger_deposit: Balance;
  votes_for: Balance;
  voters_for: Vec<ITuple<[AccountId, Balance]>>;
  votes_against: Balance;
  voters_against: Vec<ITuple<[AccountId, Balance]>>;
  created_block: BlockNumber;
  challenged_block: BlockNumber;
};

export enum ApplicationStatus {
  pending = "application",
  passed = "member",
  countered = "countered",
  challenged = "challenged",
  refused = "refused",
  accepted = "accepted",
}

export type VestingScheduleOf = {
  start: u32;
  period: u32;
  periodCount: u32;
  perPeriod: u128;
};

export type RootCertificate = {
  owner: AccountId;
  key: CertificateId;
  created: BlockNumber;
  renewed: BlockNumber;
  revoked: bool;
  validity: BlockNumber;
  child_revocations: Vec<CertificateId>;
};

export interface AccountBlockData {
  address: string | GenericAccountId;
  blockId?: number;
  blockHash: BlockHash;
  blockNumber?: number;
}
