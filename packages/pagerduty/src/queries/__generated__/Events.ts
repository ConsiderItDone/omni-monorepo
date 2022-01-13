/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Events
// ====================================================

export interface Events_events_items_block {
  __typename: 'Block';
  number: string;
  timestamp: any;
}

export interface Events_events_items_extrinsic {
  __typename: 'Extrinsic';
  index: number;
}

export interface Events_events_items_module {
  __typename: 'Module';
  name: string;
}

export interface Events_events_items_eventType {
  __typename: 'EventType';
  name: string;
}

export interface Events_events_items {
  __typename: 'Event';
  block: Events_events_items_block | null;
  index: number;
  extrinsicHash: string | null;
  extrinsic: Events_events_items_extrinsic | null;
  module: Events_events_items_module | null;
  eventType: Events_events_items_eventType | null;
  data: any | null;
}

export interface Events_events {
  __typename: 'EventsResponse';
  totalCount: number;
  items: Events_events_items[];
}

export interface Events {
  events: Events_events;
}

export interface EventsVariables {
  callModule?: string | null;
  eventName?: string | null;
  skip?: number | null;
  dateStart?: any | null;
  dateEnd?: any | null;
  extrinsicHash?: string | null;
}
