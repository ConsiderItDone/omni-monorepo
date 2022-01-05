/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Search
// ====================================================

export interface Search_blockByBlockNumber {
  __typename: 'Block';
  number: string;
}

export interface Search_extrinsicById_block {
  __typename: 'Block';
  number: string;
}

export interface Search_extrinsicById {
  __typename: 'Extrinsic';
  block: Search_extrinsicById_block | null;
  index: number;
}

export interface Search_accountByAddress {
  __typename: 'Account';
  address: string;
}

export interface Search_blockByHash {
  __typename: 'Block';
  hash: string;
}

export interface Search {
  blockByBlockNumber: Search_blockByBlockNumber | null;
  extrinsicById: Search_extrinsicById | null;
  accountByAddress: Search_accountByAddress | null;
  blockByHash: Search_blockByHash | null;
}

export interface SearchVariables {
  value: string;
}
