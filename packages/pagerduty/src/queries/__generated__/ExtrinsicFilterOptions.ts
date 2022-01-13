/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ExtrinsicFilterOptions
// ====================================================

export interface ExtrinsicFilterOptions_modules_items_extrinsicTypes {
  __typename: 'ExtrinsicType';
  name: string;
}

export interface ExtrinsicFilterOptions_modules_items {
  __typename: 'Module';
  name: string;
  extrinsicTypes: ExtrinsicFilterOptions_modules_items_extrinsicTypes[] | null;
}

export interface ExtrinsicFilterOptions_modules {
  __typename: 'ModuleResponse';
  items: ExtrinsicFilterOptions_modules_items[];
}

export interface ExtrinsicFilterOptions {
  modules: ExtrinsicFilterOptions_modules;
}
