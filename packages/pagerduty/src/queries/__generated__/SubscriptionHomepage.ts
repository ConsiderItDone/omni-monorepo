/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL subscription operation: SubscriptionHomepage
// ====================================================

export interface SubscriptionHomepage_newBlock_extrinsics {
  __typename: 'Extrinsic';
  length: number;
}

export interface SubscriptionHomepage_newBlock_events {
  __typename: 'Event';
  index: number;
}

export interface SubscriptionHomepage_newBlock {
  __typename: 'Block';
  number: string;
  extrinsics: SubscriptionHomepage_newBlock_extrinsics[] | null;
  events: SubscriptionHomepage_newBlock_events[] | null;
  timestamp: any;
}

export interface SubscriptionHomepage_newEventByName_extrinsic_block {
  __typename: 'Block';
  number: string;
}

export interface SubscriptionHomepage_newEventByName_extrinsic {
  __typename: 'Extrinsic';
  hash: string;
  block: SubscriptionHomepage_newEventByName_extrinsic_block | null;
  index: number;
}

export interface SubscriptionHomepage_newEventByName {
  __typename: 'Event';
  extrinsic: SubscriptionHomepage_newEventByName_extrinsic | null;
  data: any | null;
}

export interface SubscriptionHomepage {
  newBlock: SubscriptionHomepage_newBlock;
  newEventByName: SubscriptionHomepage_newEventByName;
}
