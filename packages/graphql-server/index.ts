// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { tracer } from "@nodle/utils";

import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../.env" });
} catch (e) {
  //nop
}

import express = require("express");
import { createServer } from "http";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { ApolloServerLoaderPlugin } from "type-graphql-dataloader";
import { ConnectionOptions, getConnection } from "typeorm";
import {
  connect,
  Account,
  Application,
  Balance,
  Block,
  Event,
  Extrinsic,
  ExtrinsicType,
  Log,
  RootCertificate,
  VestingSchedule,
  Validator,
  BackfillProgress,
  Vote,
  Module,
  EventType,
} from "@nodle/db";
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
import { MQ } from "@nodle/utils";
import EventTypeResolver from "./src/resolvers/eventTypeResolver";
import ModuleResolver from "./src/resolvers/moduleResolver";
import ExtrinsicTypeResolver from "./src/resolvers/extrinsicTypeResolver";
import VoteResolver from "./src/resolvers/voteResolver";
import { v4 as uuidv4 } from "uuid";

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
    logging: process.env.TYPEORM_LOGGING === "true",
    entities: [
      Account,
      Application,
      Balance,
      Block,
      Event,
      Extrinsic,
      ExtrinsicType,
      Log,
      RootCertificate,
      VestingSchedule,
      Validator,
      BackfillProgress,
      Vote,
      Module,
      EventType,
    ],
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
    context: () => ({ _tgdContext: { requestId: uuidv4() } }), // Required for type-graphql-dataloader
    plugins: [
      {
        requestDidStart(ctx): void {
          if (ctx.request.query.indexOf("schema") === -1) {
            console.log("query", ctx.request.query);
            console.log("variables", ctx.request.variables);
          }
        },
      },
      ApolloServerLoaderPlugin({
        typeormGetConnection: getConnection, // for use with TypeORM
      }),
    ],
  });

  const app = express();
  // app.use("/graphql", express.json());

  app.get("/connections", function (req: express.Request, res: express.Response) {
    server.getConnections((err, count) => {
      if (err) {
        return res.status(500).end();
      }

      res.status(200).json({
        count,
      });
    });
  });

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
