/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Validators
// ====================================================

export interface Validators_validators_items_account_balance {
  __typename: 'Balance';
  free: string | null;
  reserved: string | null;
  feeFrozen: string | null;
  miscFrozen: string | null;
}

export interface Validators_validators_items_account {
  __typename: 'Account';
  address: string;
  balance: Validators_validators_items_account_balance | null;
}

export interface Validators_validators_items {
  __typename: 'Validator';
  consumers: number;
  providers: number;
  account: Validators_validators_items_account;
}

export interface Validators_validators {
  __typename: 'ValidatorResponse';
  items: Validators_validators_items[];
  totalCount: number;
}

export interface Validators {
  validators: Validators_validators;
}

export interface ValidatorsVariables {
  skip?: number | null;
}
