import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../.env" });
} catch (e) {
  //nop
}

import express = require("express");
import bodyParser from "body-parser";
import { createServer } from "http";
import { ApolloServer } from "apollo-server-express";
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
import ValidatorResolver from "./src/resolvers/validatorResolver";
import MQ from "@nodle/utils/src/mq";
import EventTypeResolver from "./src/resolvers/eventTypeResolver";
import ModuleResolver from "./src/resolvers/moduleResolver";
import ExtrinsicTypeResolver from "./src/resolvers/extrinsicTypeResolver";
import VoteResolver from "./src/resolvers/voteResolver";

const PORT = process.env.GRAPHQL_SERVER_PORT || 4000;
(async (): Promise<void> => {
  const connectionOptions = {
    name: "default",
    type: "postgres",
    host: process.env.TYPEORM_HOST,
    port: Number(process.env.TYPEORM_PORT),
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    logging: process.env.TYPEORM_LOGGING,
    entities: ["../db/src/models/*.ts", "../db/src/models/**/*.ts"],
  } as ConnectionOptions;
  await connect(connectionOptions);
  await MQ.init(process.env.RABBIT_MQ_URL); // init MQ connection
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
      ValidatorResolver,
      EventTypeResolver,
      ModuleResolver,
      ExtrinsicTypeResolver,
      VoteResolver,
    ],
  });

  const apolloServer = new ApolloServer({
    schema,
    introspection: true,
    playground: true,
  });

  const app = express();
  app.use("/graphql", bodyParser.json());

  app.get("/", function (req: express.Request, res: express.Response) {
    res.status(200).end();
  });
  apolloServer.applyMiddleware({ app });

  const server = createServer(app);
  apolloServer.installSubscriptionHandlers(server);

  server.listen(PORT, () => {
    console.log(`GraphQL server running at http://localhost:${PORT}${apolloServer.graphqlPath}`);
    console.log(`Subscription server running at ws://localhost:${PORT}${apolloServer.subscriptionsPath}`);
  });
})();
