/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ExtrinsicsDetails
// ====================================================

export interface ExtrinsicsDetails_extrinsicById_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
  finalized: boolean;
}

export interface ExtrinsicsDetails_extrinsicById_module {
  __typename: 'Module';
  name: string;
}

export interface ExtrinsicsDetails_extrinsicById_extrinsicType {
  __typename: 'ExtrinsicType';
  name: string;
}

export interface ExtrinsicsDetails_extrinsicById_signer {
  __typename: 'Account';
  address: string;
}

export interface ExtrinsicsDetails_extrinsicById_events_module {
  __typename: 'Module';
  name: string;
}

export interface ExtrinsicsDetails_extrinsicById_events_eventType {
  __typename: 'EventType';
  name: string;
}

export interface ExtrinsicsDetails_extrinsicById_events {
  __typename: 'Event';
  index: number;
  extrinsicHash: string | null;
  module: ExtrinsicsDetails_extrinsicById_events_module | null;
  data: any | null;
  eventType: ExtrinsicsDetails_extrinsicById_events_eventType | null;
}

export interface ExtrinsicsDetails_extrinsicById {
  __typename: 'Extrinsic';
  index: number;
  block: ExtrinsicsDetails_extrinsicById_block | null;
  hash: string;
  module: ExtrinsicsDetails_extrinsicById_module | null;
  extrinsicType: ExtrinsicsDetails_extrinsicById_extrinsicType | null;
  signer: ExtrinsicsDetails_extrinsicById_signer | null;
  fee: any | null;
  nonce: number | null;
  success: boolean;
  params: string;
  signature: string | null;
  events: ExtrinsicsDetails_extrinsicById_events[] | null;
}

export interface ExtrinsicsDetails {
  extrinsicById: ExtrinsicsDetails_extrinsicById | null;
}

export interface ExtrinsicsDetailsVariables {
  id: string;
}
