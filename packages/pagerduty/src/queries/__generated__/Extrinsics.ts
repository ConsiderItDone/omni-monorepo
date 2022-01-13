/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Extrinsics
// ====================================================

export interface Extrinsics_extrinsics_items_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
}

export interface Extrinsics_extrinsics_items_module {
  __typename: 'Module';
  name: string;
}

export interface Extrinsics_extrinsics_items_extrinsicType {
  __typename: 'ExtrinsicType';
  name: string;
}

export interface Extrinsics_extrinsics_items {
  __typename: 'Extrinsic';
  block: Extrinsics_extrinsics_items_block | null;
  index: number;
  hash: string;
  success: boolean;
  module: Extrinsics_extrinsics_items_module | null;
  extrinsicType: Extrinsics_extrinsics_items_extrinsicType | null;
  params: string;
}

export interface Extrinsics_extrinsics {
  __typename: 'ExtrinsicsResponse';
  totalCount: number;
  items: Extrinsics_extrinsics_items[];
}

export interface Extrinsics {
  extrinsics: Extrinsics_extrinsics;
}

export interface ExtrinsicsVariables {
  callModule?: string | null;
  callFunction?: string | null;
  signedOnly?: boolean | null;
  skip?: number | null;
  dateStart?: any | null;
  dateEnd?: any | null;
  signer?: string | null;
}
