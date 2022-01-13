/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Block
// ====================================================

export interface Block_blockByHash_extrinsics_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
}

export interface Block_blockByHash_extrinsics_module {
  __typename: 'Module';
  name: string;
}

export interface Block_blockByHash_extrinsics_extrinsicType {
  __typename: 'ExtrinsicType';
  name: string;
}

export interface Block_blockByHash_extrinsics {
  __typename: 'Extrinsic';
  index: number;
  hash: string;
  block: Block_blockByHash_extrinsics_block | null;
  success: boolean;
  module: Block_blockByHash_extrinsics_module | null;
  extrinsicType: Block_blockByHash_extrinsics_extrinsicType | null;
  params: string;
}

export interface Block_blockByHash_events_module {
  __typename: 'Module';
  name: string;
}

export interface Block_blockByHash_events_eventType {
  __typename: 'EventType';
  name: string;
}

export interface Block_blockByHash_events {
  __typename: 'Event';
  index: number;
  extrinsicHash: string | null;
  module: Block_blockByHash_events_module | null;
  eventType: Block_blockByHash_events_eventType | null;
  data: any | null;
}

export interface Block_blockByHash_logs {
  __typename: 'Log';
  index: string;
  type: string;
  data: string;
}

export interface Block_blockByHash {
  __typename: 'Block';
  number: string;
  finalized: boolean;
  timestamp: any;
  hash: string;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  specVersion: number;
  extrinsics: Block_blockByHash_extrinsics[] | null;
  events: Block_blockByHash_events[] | null;
  logs: Block_blockByHash_logs[] | null;
}

export interface Block_blockByBlockNumber_extrinsics_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
}

export interface Block_blockByBlockNumber_extrinsics_module {
  __typename: 'Module';
  name: string;
}

export interface Block_blockByBlockNumber_extrinsics_extrinsicType {
  __typename: 'ExtrinsicType';
  name: string;
}

export interface Block_blockByBlockNumber_extrinsics {
  __typename: 'Extrinsic';
  index: number;
  hash: string;
  block: Block_blockByBlockNumber_extrinsics_block | null;
  success: boolean;
  module: Block_blockByBlockNumber_extrinsics_module | null;
  extrinsicType: Block_blockByBlockNumber_extrinsics_extrinsicType | null;
  params: string;
}

export interface Block_blockByBlockNumber_events_module {
  __typename: 'Module';
  name: string;
}

export interface Block_blockByBlockNumber_events_eventType {
  __typename: 'EventType';
  name: string;
}

export interface Block_blockByBlockNumber_events {
  __typename: 'Event';
  index: number;
  extrinsicHash: string | null;
  module: Block_blockByBlockNumber_events_module | null;
  eventType: Block_blockByBlockNumber_events_eventType | null;
  data: any | null;
}

export interface Block_blockByBlockNumber_logs {
  __typename: 'Log';
  index: string;
  type: string;
  data: string;
}

export interface Block_blockByBlockNumber {
  __typename: 'Block';
  number: string;
  finalized: boolean;
  timestamp: any;
  hash: string;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  specVersion: number;
  extrinsics: Block_blockByBlockNumber_extrinsics[] | null;
  events: Block_blockByBlockNumber_events[] | null;
  logs: Block_blockByBlockNumber_logs[] | null;
}

export interface Block {
  blockByHash: Block_blockByHash | null;
  blockByBlockNumber: Block_blockByBlockNumber | null;
}

export interface BlockVariables {
  id: string;
}
