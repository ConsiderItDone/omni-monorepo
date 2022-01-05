/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: HomePage
// ====================================================

export interface HomePage_lastFinalizedBlock {
  __typename: 'Block';
  number: string;
}

export interface HomePage_signedExtrinsics {
  __typename: 'ExtrinsicsResponse';
  totalCount: number;
}

export interface HomePage_blocks_items_extrinsics {
  __typename: 'Extrinsic';
  length: number;
}

export interface HomePage_blocks_items_events {
  __typename: 'Event';
  index: number;
}

export interface HomePage_blocks_items {
  __typename: 'Block';
  number: string;
  hash: string;
  extrinsics: HomePage_blocks_items_extrinsics[] | null;
  events: HomePage_blocks_items_events[] | null;
  finalized: boolean;
  timestamp: any;
}

export interface HomePage_blocks {
  __typename: 'BlockResponse';
  items: HomePage_blocks_items[];
}

export interface HomePage_transfers_items_extrinsic_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
}

export interface HomePage_transfers_items_extrinsic {
  __typename: 'Extrinsic';
  hash: string;
  block: HomePage_transfers_items_extrinsic_block | null;
  index: number;
}

export interface HomePage_transfers_items {
  __typename: 'Event';
  extrinsic: HomePage_transfers_items_extrinsic | null;
  index: number;
  data: any | null;
}

export interface HomePage_transfers {
  __typename: 'EventsResponse';
  items: HomePage_transfers_items[];
  totalCount: number;
}

export interface HomePage_allocations_items_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
}

export interface HomePage_allocations_items {
  __typename: 'Event';
  block: HomePage_allocations_items_block | null;
  data: any | null;
}

export interface HomePage_allocations {
  __typename: 'EventsResponse';
  totalCount: number;
  items: HomePage_allocations_items[];
}

export interface HomePage_validators_items_account {
  __typename: 'Account';
  address: string;
}

export interface HomePage_validators_items {
  __typename: 'Validator';
  account: HomePage_validators_items_account;
}

export interface HomePage_validators {
  __typename: 'ValidatorResponse';
  items: HomePage_validators_items[];
  totalCount: number;
}

export interface HomePage {
  lastFinalizedBlock: HomePage_lastFinalizedBlock | null;
  signedExtrinsics: HomePage_signedExtrinsics;
  blocks: HomePage_blocks;
  transfers: HomePage_transfers;
  allocations: HomePage_allocations;
  validators: HomePage_validators;
}
