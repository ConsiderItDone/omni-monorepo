/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Allocations
// ====================================================

export interface Allocations_events_items_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
}

export interface Allocations_events_items_extrinsic_signer {
  __typename: 'Account';
  address: string;
}

export interface Allocations_events_items_extrinsic {
  __typename: 'Extrinsic';
  signer: Allocations_events_items_extrinsic_signer | null;
}

export interface Allocations_events_items {
  __typename: 'Event';
  block: Allocations_events_items_block | null;
  extrinsic: Allocations_events_items_extrinsic | null;
  data: any | null;
}

export interface Allocations_events {
  __typename: 'EventsResponse';
  totalCount: number;
  items: Allocations_events_items[];
}

export interface Allocations {
  events: Allocations_events;
}

export interface AllocationsVariables {
  skip?: number | null;
  filters?: any | null;
}
