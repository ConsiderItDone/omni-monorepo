import {ConnectionOptions, createConnection, Connection} from "typeorm";

export async function connect(connectionOptions: ConnectionOptions): Promise<Connection> {
    const connection = await createConnection(connectionOptions);
    return connection;
}
