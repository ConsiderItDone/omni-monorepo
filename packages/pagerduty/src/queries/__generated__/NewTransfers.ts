/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL subscription operation: NewTransfers
// ====================================================

export interface NewTransfers_newEventByName_extrinsic_block {
  __typename: 'Block';
  number: string;
}

export interface NewTransfers_newEventByName_extrinsic {
  __typename: 'Extrinsic';
  hash: string;
  block: NewTransfers_newEventByName_extrinsic_block | null;
  index: number;
}

export interface NewTransfers_newEventByName {
  __typename: 'Event';
  extrinsic: NewTransfers_newEventByName_extrinsic | null;
  index: number;
  data: any | null;
}

export interface NewTransfers {
  newEventByName: NewTransfers_newEventByName;
}
