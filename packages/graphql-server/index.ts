import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
let envConfig = process.env;
try {
  envConfig = dotenv.parse(
    fs.readFileSync(path.resolve(__dirname) + "/../../.env")
  );
} catch (e) {
  //nop
}
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
import MQ from "@nodle/utils/src/mq";
const PORT = envConfig.GRAPHQL_SERVER_PORT || 4000;
(async (): Promise<void> => {
  const connectionOptions = {
    name: "default",
    type: "postgres",
    host: envConfig.TYPEORM_HOST,
    port: Number(envConfig.TYPEORM_PORT),
    username: envConfig.TYPEORM_USERNAME,
    password: envConfig.TYPEORM_PASSWORD,
    database: envConfig.TYPEORM_DATABASE,
    logging: false,
    entities: ["../db/src/models/*.ts", "../db/src/models/**/*.ts"],
  } as ConnectionOptions;
  await connect(connectionOptions);
  await MQ.init(envConfig.RABBIT_MQ_URL); // init MQ connection
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
  await new ApolloServer({
    schema,
    introspection: true,
    playground: true,
  }).listen(PORT);
  console.info(`GraphQL server running on port ${PORT}`);
})();
