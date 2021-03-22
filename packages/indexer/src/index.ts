import { subscribe } from "./services/subscribe";
import {createConnection} from "typeorm";
import {connect} from "@nodle/db";

const start = async function() {
    const connectionOptions = { // TODO: use env
        type: "postgres",
        host: process.env.TYPEORM_HOST || "3.217.156.114",
        port: Number(process.env.TYPEORM_PORT || 54321),
        username: process.env.TYPEORM_USERNAME || "nodle",
        password: process.env.TYPEORM_PASSWORD || "password",
        database: process.env.TYPEORM_DATABASE || "nodle",
        logging: false,
        entities: [
            '../db/src/models/*.ts',
            '../db/src/models/**/*.ts'
        ],
        migrations: [
            '../db/dist/migrations/*.js'
        ],
    } as any;

    const connection = await connect(connectionOptions);

    subscribe(connection); // run subscription
}

export const Indexer = {
  start,
};
