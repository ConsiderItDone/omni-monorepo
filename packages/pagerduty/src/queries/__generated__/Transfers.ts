/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Transfers
// ====================================================

export interface Transfers_events_items_extrinsic_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
}

export interface Transfers_events_items_extrinsic {
  __typename: 'Extrinsic';
  hash: string;
  block: Transfers_events_items_extrinsic_block | null;
  index: number;
}

export interface Transfers_events_items {
  __typename: 'Event';
  extrinsic: Transfers_events_items_extrinsic | null;
  index: number;
  data: any | null;
}

export interface Transfers_events {
  __typename: 'EventsResponse';
  items: Transfers_events_items[];
  totalCount: number;
}

export interface Transfers {
  events: Transfers_events;
}

export interface TransfersVariables {
  skip?: number | null;
  filters?: any | null;
}
