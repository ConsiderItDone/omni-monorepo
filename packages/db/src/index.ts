import { ConnectionOptions, createConnection, Connection } from "typeorm";

export * as repositories from "./repositories";

export * as models from "./models";

export async function connect(connectionOptions: ConnectionOptions): Promise<Connection> {
  const connection = await createConnection(connectionOptions);
  return connection;
}
