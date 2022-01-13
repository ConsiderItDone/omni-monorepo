import Client from "./client";
import { BLOCK } from "./queries/index";
console.log("hello");
const client = new Client(process.env.GRAPHQL_ENDPOINT);

client.query(BLOCK, { id: "123456" });
