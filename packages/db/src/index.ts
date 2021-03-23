import { ConnectionOptions, createConnection, Connection } from "typeorm";

export * as Repositories from './repositories';

export async function connect(
  connectionOptions: ConnectionOptions
): Promise<Connection> {
  const connection = await createConnection(connectionOptions);
  return connection;
}
