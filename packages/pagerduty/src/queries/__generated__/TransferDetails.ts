/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: TransferDetails
// ====================================================

export interface TransferDetails_eventsByIndex_items_module {
  __typename: 'Module';
  name: string;
}

export interface TransferDetails_eventsByIndex_items_eventType {
  __typename: 'EventType';
  name: string;
}

export interface TransferDetails_eventsByIndex_items_extrinsic {
  __typename: 'Extrinsic';
  nonce: number | null;
  hash: string;
  index: number;
  success: boolean;
}

export interface TransferDetails_eventsByIndex_items_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
  finalized: boolean;
}

export interface TransferDetails_eventsByIndex_items {
  __typename: 'Event';
  module: TransferDetails_eventsByIndex_items_module | null;
  eventType: TransferDetails_eventsByIndex_items_eventType | null;
  index: number;
  extrinsicHash: string | null;
  extrinsic: TransferDetails_eventsByIndex_items_extrinsic | null;
  block: TransferDetails_eventsByIndex_items_block | null;
  data: any | null;
}

export interface TransferDetails_eventsByIndex {
  __typename: 'EventsResponse';
  items: TransferDetails_eventsByIndex_items[];
}

export interface TransferDetails {
  eventsByIndex: TransferDetails_eventsByIndex;
}

export interface TransferDetailsVariables {
  blockNumber: number;
  extrinsicIndex: number;
  eventIndex: number;
}
