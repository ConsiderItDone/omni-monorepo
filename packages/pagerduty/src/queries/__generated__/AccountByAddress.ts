/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AccountByAddress
// ====================================================

export interface AccountByAddress_accountByAddress_validator {
  __typename: 'Validator';
  providers: number;
  consumers: number;
}

export interface AccountByAddress_accountByAddress_balance {
  __typename: 'Balance';
  free: string | null;
  feeFrozen: string | null;
  miscFrozen: string | null;
  reserved: string | null;
}

export interface AccountByAddress_accountByAddress_extrinsics_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
}

export interface AccountByAddress_accountByAddress_extrinsics_module {
  __typename: 'Module';
  name: string;
}

export interface AccountByAddress_accountByAddress_extrinsics_extrinsicType {
  __typename: 'ExtrinsicType';
  name: string;
}

export interface AccountByAddress_accountByAddress_extrinsics {
  __typename: 'Extrinsic';
  block: AccountByAddress_accountByAddress_extrinsics_block | null;
  index: number;
  hash: string;
  success: boolean;
  module: AccountByAddress_accountByAddress_extrinsics_module | null;
  extrinsicType: AccountByAddress_accountByAddress_extrinsics_extrinsicType | null;
  params: string;
}

export interface AccountByAddress_accountByAddress_vestingSchedules {
  __typename: 'VestingSchedule';
  start: string;
  period: string;
  perPeriod: string;
  periodCount: number;
}

export interface AccountByAddress_accountByAddress_applicationsByCandidate_candidate {
  __typename: 'Account';
  address: string;
}

export interface AccountByAddress_accountByAddress_applicationsByCandidate_challenger {
  __typename: 'Account';
  address: string;
}

export interface AccountByAddress_accountByAddress_applicationsByCandidate {
  __typename: 'Application';
  candidate: AccountByAddress_accountByAddress_applicationsByCandidate_candidate | null;
  candidateDeposit: number;
  metadata: string;
  challenger: AccountByAddress_accountByAddress_applicationsByCandidate_challenger | null;
  challengerDeposit: number | null;
  createdBlock: string;
  challengedBlock: string;
  status: string | null;
}

export interface AccountByAddress_accountByAddress_applicationsByChallenger_candidate {
  __typename: 'Account';
  address: string;
}

export interface AccountByAddress_accountByAddress_applicationsByChallenger_challenger {
  __typename: 'Account';
  address: string;
}

export interface AccountByAddress_accountByAddress_applicationsByChallenger {
  __typename: 'Application';
  candidate: AccountByAddress_accountByAddress_applicationsByChallenger_candidate | null;
  candidateDeposit: number;
  metadata: string;
  challenger: AccountByAddress_accountByAddress_applicationsByChallenger_challenger | null;
  challengerDeposit: number | null;
  createdBlock: string;
  challengedBlock: string;
  status: string | null;
}

export interface AccountByAddress_accountByAddress_rootCertificatesByKey_owner {
  __typename: 'Account';
  address: string;
}

export interface AccountByAddress_accountByAddress_rootCertificatesByKey_key {
  __typename: 'Account';
  address: string;
}

export interface AccountByAddress_accountByAddress_rootCertificatesByKey {
  __typename: 'RootCertificate';
  owner: AccountByAddress_accountByAddress_rootCertificatesByKey_owner | null;
  key: AccountByAddress_accountByAddress_rootCertificatesByKey_key | null;
  revoked: boolean;
  childRevocations: string[] | null;
  created: string;
  renewed: string;
  validity: number;
}

export interface AccountByAddress_accountByAddress_rootCertificatesByOwner_owner {
  __typename: 'Account';
  address: string;
}

export interface AccountByAddress_accountByAddress_rootCertificatesByOwner_key {
  __typename: 'Account';
  address: string;
}

export interface AccountByAddress_accountByAddress_rootCertificatesByOwner {
  __typename: 'RootCertificate';
  owner: AccountByAddress_accountByAddress_rootCertificatesByOwner_owner | null;
  key: AccountByAddress_accountByAddress_rootCertificatesByOwner_key | null;
  revoked: boolean;
  childRevocations: string[] | null;
  created: string;
  renewed: string;
  validity: number;
}

export interface AccountByAddress_accountByAddress {
  __typename: 'Account';
  address: string;
  nonce: number | null;
  refcount: number | null;
  validator: AccountByAddress_accountByAddress_validator | null;
  balance: AccountByAddress_accountByAddress_balance | null;
  extrinsics: AccountByAddress_accountByAddress_extrinsics[] | null;
  vestingSchedules: AccountByAddress_accountByAddress_vestingSchedules[] | null;
  applicationsByCandidate: AccountByAddress_accountByAddress_applicationsByCandidate[] | null;
  applicationsByChallenger: AccountByAddress_accountByAddress_applicationsByChallenger[] | null;
  rootCertificatesByKey: AccountByAddress_accountByAddress_rootCertificatesByKey[] | null;
  rootCertificatesByOwner: AccountByAddress_accountByAddress_rootCertificatesByOwner[] | null;
}

export interface AccountByAddress_allocations_items_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
}

export interface AccountByAddress_allocations_items_extrinsic_signer {
  __typename: 'Account';
  address: string;
}

export interface AccountByAddress_allocations_items_extrinsic {
  __typename: 'Extrinsic';
  signer: AccountByAddress_allocations_items_extrinsic_signer | null;
}

export interface AccountByAddress_allocations_items {
  __typename: 'Event';
  block: AccountByAddress_allocations_items_block | null;
  extrinsic: AccountByAddress_allocations_items_extrinsic | null;
  data: any | null;
}

export interface AccountByAddress_allocations {
  __typename: 'EventsResponse';
  items: AccountByAddress_allocations_items[];
}

export interface AccountByAddress_transfersFrom_items_extrinsic_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
}

export interface AccountByAddress_transfersFrom_items_extrinsic {
  __typename: 'Extrinsic';
  hash: string;
  block: AccountByAddress_transfersFrom_items_extrinsic_block | null;
  index: number;
}

export interface AccountByAddress_transfersFrom_items {
  __typename: 'Event';
  extrinsic: AccountByAddress_transfersFrom_items_extrinsic | null;
  data: any | null;
  index: number;
}

export interface AccountByAddress_transfersFrom {
  __typename: 'EventsResponse';
  items: AccountByAddress_transfersFrom_items[];
}

export interface AccountByAddress_transfersTo_items_extrinsic_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
}

export interface AccountByAddress_transfersTo_items_extrinsic {
  __typename: 'Extrinsic';
  hash: string;
  block: AccountByAddress_transfersTo_items_extrinsic_block | null;
  index: number;
}

export interface AccountByAddress_transfersTo_items {
  __typename: 'Event';
  extrinsic: AccountByAddress_transfersTo_items_extrinsic | null;
  data: any | null;
  index: number;
}

export interface AccountByAddress_transfersTo {
  __typename: 'EventsResponse';
  items: AccountByAddress_transfersTo_items[];
}

export interface AccountByAddress {
  accountByAddress: AccountByAddress_accountByAddress | null;
  allocations: AccountByAddress_allocations;
  transfersFrom: AccountByAddress_transfersFrom;
  transfersTo: AccountByAddress_transfersTo;
}

export interface AccountByAddressVariables {
  address: string;
}
