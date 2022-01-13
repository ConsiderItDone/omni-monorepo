/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ExtrinsicByBlockNumber
// ====================================================

export interface ExtrinsicByBlockNumber_getExtrinsicsByBlockNumber_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
}

export interface ExtrinsicByBlockNumber_getExtrinsicsByBlockNumber_events {
  __typename: 'Event';
  index: number;
  extrinsicHash: string | null;
  moduleName: string;
  eventName: string;
}

export interface ExtrinsicByBlockNumber_getExtrinsicsByBlockNumber {
  __typename: 'Extrinsic';
  index: number;
  block: ExtrinsicByBlockNumber_getExtrinsicsByBlockNumber_block | null;
  hash: string;
  callModule: string;
  callModuleFunction: string;
  signer: string | null;
  nonce: number | null;
  success: boolean;
  params: string;
  signature: string | null;
  events: ExtrinsicByBlockNumber_getExtrinsicsByBlockNumber_events[] | null;
}

export interface ExtrinsicByBlockNumber {
  getExtrinsicsByBlockNumber: ExtrinsicByBlockNumber_getExtrinsicsByBlockNumber[];
}
