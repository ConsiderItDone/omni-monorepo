import { gql } from "graphql-request";

export const queryTransfer = gql`
  query($hash: String!) {
    extrinsicByHash(hash: $hash) {
      events(eventNames: ["Transfer"]) {
        data
      }
    }
  }
`;

export const queryRootCertificates = gql`
  query($address: String!) {
    accountByAddress(address: $address) {
      rootCertificatesByKey {
        created
        revoked
        renewed
      }
    }
  }
`;
export const queryLastBalance = gql`
  query($address: String!) {
    balanceByAddress(address: $address) {
      free
    }
  }
`;

export const queryVestingSchedules = gql`
  query($address: String!) {
    accountByAddress(address: $address) {
      vestingSchedules {
        start
        period
        periodCount
        perPeriod
      }
    }
  }
`;
