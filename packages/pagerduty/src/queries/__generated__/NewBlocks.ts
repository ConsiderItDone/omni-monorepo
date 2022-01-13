/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL subscription operation: NewBlocks
// ====================================================

export interface NewBlocks_newBlock_extrinsics {
  __typename: 'Extrinsic';
  length: number;
}

export interface NewBlocks_newBlock_events {
  __typename: 'Event';
  index: number;
}

export interface NewBlocks_newBlock {
  __typename: 'Block';
  number: string;
  extrinsics: NewBlocks_newBlock_extrinsics[] | null;
  events: NewBlocks_newBlock_events[] | null;
  timestamp: any;
  finalized: boolean;
  hash: string;
}

export interface NewBlocks {
  newBlock: NewBlocks_newBlock;
}
