/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Applications
// ====================================================

export interface Applications_applications_items_candidate {
  __typename: 'Account';
  address: string;
}

export interface Applications_applications_items_challenger {
  __typename: 'Account';
  address: string;
}

export interface Applications_applications_items {
  __typename: 'Application';
  candidate: Applications_applications_items_candidate | null;
  candidateDeposit: number;
  metadata: string;
  challenger: Applications_applications_items_challenger | null;
  challengerDeposit: number | null;
  createdBlock: string;
  challengedBlock: string;
  status: string | null;
}

export interface Applications_applications {
  __typename: 'ApplicationResponse';
  items: Applications_applications_items[];
  totalCount: number;
}

export interface Applications {
  applications: Applications_applications;
}

export interface ApplicationsVariables {
  skip: number;
}
