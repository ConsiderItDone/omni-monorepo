/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: RootCertificates
// ====================================================

export interface RootCertificates_rootCertificates_items_owner {
  __typename: 'Account';
  address: string;
}

export interface RootCertificates_rootCertificates_items_key {
  __typename: 'Account';
  address: string;
}

export interface RootCertificates_rootCertificates_items {
  __typename: 'RootCertificate';
  owner: RootCertificates_rootCertificates_items_owner | null;
  key: RootCertificates_rootCertificates_items_key | null;
  revoked: boolean;
  childRevocations: string[] | null;
  created: string;
  renewed: string;
  validity: number;
}

export interface RootCertificates_rootCertificates {
  __typename: 'RootCertificateResponse';
  items: RootCertificates_rootCertificates_items[];
  totalCount: number;
}

export interface RootCertificates {
  rootCertificates: RootCertificates_rootCertificates;
}

export interface RootCertificatesVariables {
  skip: number;
}
