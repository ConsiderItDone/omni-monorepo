import { ApolloServer } from "apollo-server";
import { buildSchema } from "type-graphql";
import { ConnectionOptions } from "typeorm";
import { connect } from "@nodle/db";

import BlockResolver from "./src/resolvers/blockResolver";
import EventResolver from "./src/resolvers/eventResolver";
import LogResolver from "./src/resolvers/logResolver";
import RootCertificateResolver from "./src/resolvers/rootCertificateResolver";
import ExtrinsicResolver from "./src/resolvers/extrinsicResolver";
import AccountResolver from "./src/resolvers/accountResolver";
import ApplicationResolver from "./src/resolvers/applicationResolver";
import BalanceResolver from "./src/resolvers/balanceResolver";
import VestingScheduleResolver from "./src/resolvers/vestingScheduleResolver";

const PORT = 4000; // env.GRAPHQL_SERVER_PORT

(async (): Promise<void> => {
  const connectionOptions = {
    // TODO: use env
    name: "default",
    type: "postgres",
    host: process.env.TYPEORM_HOST || "3.217.156.114",
    port: Number(process.env.TYPEORM_PORT || 54321),
    username: process.env.TYPEORM_USERNAME || "nodle",
    password: process.env.TYPEORM_PASSWORD || "password",
    database: process.env.TYPEORM_DATABASE || "nodle",
    logging: false,
    entities: ["../db/src/models/*.ts", "../db/src/models/**/*.ts"],
  } as ConnectionOptions;

  await connect(connectionOptions);

  const schema = await buildSchema({
    resolvers: [
      AccountResolver,
      ApplicationResolver,
      BalanceResolver,
      BlockResolver,
      EventResolver,
      LogResolver,
      RootCertificateResolver,
      ExtrinsicResolver,
      VestingScheduleResolver,
    ],
  });

  await new ApolloServer({ schema }).listen(PORT);

  console.info(`GraphQL server running on port ${PORT}`);
})();
