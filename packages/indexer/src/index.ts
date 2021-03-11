import { createConnection, ConnectionOptions } from "typeorm";
import { ApolloServer } from "apollo-server";
import { buildSchema } from "type-graphql";
import { DateUtils } from "@nodle/utils";
import BlockResolver from "./resolvers/blockResolver";
import EventResolver from "./resolvers/eventResolver";
import env from "./env";
import { subscribe } from "./services/subscribe";

const start = async function () {
  const connectionOptions: ConnectionOptions = {
    type: "postgres",
    host: env.TYPEORM_HOST,
    port: env.TYPEORM_PORT,
    username: env.TYPEORM_USERNAME,
    password: env.TYPEORM_PASSWORD,
    database: env.TYPEORM_DATABASE,
    logging: env.TYPEORM_LOGGING,
    entities:
      process.env.NODE_ENV === "production"
        ? [__dirname + "/dist/models/*.js", __dirname + "/dist/models/**/*.js"]
        : ["src/models/*.ts", "src/models/**/*.ts"],
    migrations:
      process.env.NODE_ENV === "production"
        ? [__dirname + "/dist/migrations/*.js"]
        : ["src/migrations/*.ts"],
    cli: {
      entitiesDir: "src/models",
      migrationsDir: "src/migrations",
    },
  };

  await createConnection(connectionOptions);

  // TODO: create subscription from services/subscribe
  // TODO: process data

  subscribe(); // rub subscription

  const schema = await buildSchema({
    resolvers: [BlockResolver, EventResolver],
  });
  // TODO: move apollo to separate module
  await new ApolloServer({ schema }).listen(env.GRAPHQL_SERVER_PORT);

  console.info(
    `GraphQL server running on port ${env.GRAPHQL_SERVER_PORT}`,
    DateUtils.getCurrentDate()
  );
};

export const Indexer = {
  start,
};
