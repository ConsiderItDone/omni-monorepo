import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../.env" });
} catch (e) {
  //nop
}

import { backfiller } from "./services/backfiller";
import { patcher } from "./services/patcher";
import { connect } from "@nodle/db";
import { connectionOptions } from "./utils";

const start = async function (): Promise<void> {
  const connection = await connect(connectionOptions);

  if (process.argv && process.argv.length > 1 && process.argv[process.argv.length - 1] === "patcher-only") {
    patcher(process.env.WS_PROVIDER, connection);
  } else {
    backfiller(process.env.WS_PROVIDER, connection);
  }
};

export const Backfiller = {
  start,
};
