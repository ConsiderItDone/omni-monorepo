import Client from "./client";
import { BLOCK } from "./queries/index";
import * as queries from "./queries";

console.log("hello");
const client = new Client(process.env.GRAPHQL_ENDPOINT);

const variables: { [key: string]: any } = {
  /*   BLOCKS
BLOCK
TRANSFERS
CHART_TRANSFERTS
CHART_EXTRINSICS
ACCOUNTS
VALIDATORS
EXTRINSICS
EXTRINSICSDETAILTS
EVENTS
SEARCH
ROOT_CERTIFICATES
APPLICATIONS
ACCOUNTBYADDRESS
EXTRINSIC_FILTER_OPTIONS
EVENT_FILTER_OPTIONS
ALLOCATIONS
TRANSFERDETAILS */
};

function run() {
  const keys = Object.keys(queries);
  for (const key of keys) {
    if (variables[key]) {
      //@ts-ignore
      client.query(queries[key], variables[key]);
    }
  }
}

run();
