/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Accounts
// ====================================================

export interface Accounts_accounts_items_balance {
  __typename: 'Balance';
  free: string | null;
  feeFrozen: string | null;
  miscFrozen: string | null;
  reserved: string | null;
}

export interface Accounts_accounts_items {
  __typename: 'Account';
  address: string;
  balance: Accounts_accounts_items_balance | null;
}

export interface Accounts_accounts {
  __typename: 'AccountResponse';
  items: Accounts_accounts_items[];
  totalCount: number;
}

export interface Accounts {
  accounts: Accounts_accounts;
}

export interface AccountsVariables {
  skip?: number | null;
}
