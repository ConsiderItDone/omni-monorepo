/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Blocks
// ====================================================

export interface Blocks_blocks_items_extrinsics {
  __typename: 'Extrinsic';
  index: number;
}

export interface Blocks_blocks_items_events {
  __typename: 'Event';
  index: number;
}

export interface Blocks_blocks_items {
  __typename: 'Block';
  number: string;
  timestamp: any;
  extrinsics: Blocks_blocks_items_extrinsics[] | null;
  events: Blocks_blocks_items_events[] | null;
  hash: string;
  finalized: boolean;
}

export interface Blocks_blocks {
  __typename: 'BlockResponse';
  items: Blocks_blocks_items[];
  totalCount: number;
}

export interface Blocks {
  blocks: Blocks_blocks;
}

export interface BlocksVariables {
  skip?: number | null;
}
