/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: EventFilterOptions
// ====================================================

export interface EventFilterOptions_modules_items_eventTypes {
  __typename: 'EventType';
  name: string;
}

export interface EventFilterOptions_modules_items {
  __typename: 'Module';
  name: string;
  eventTypes: EventFilterOptions_modules_items_eventTypes[] | null;
}

export interface EventFilterOptions_modules {
  __typename: 'ModuleResponse';
  items: EventFilterOptions_modules_items[];
}

export interface EventFilterOptions {
  modules: EventFilterOptions_modules;
}
