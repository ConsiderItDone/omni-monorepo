import * as dotenv from "dotenv";
import path from "path";
import { getApi } from "@nodle/polkadot/src/api";
import MQ from "@nodle/utils/dist/src/mq";

try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../../.env" });
} catch (e) {
  //nop
}

async function updateAccount(address: string) {
  console.log(`Updating ${address}`);
  const api = await getApi(process.env.WS_PROVIDER);

  const { hash } = await api.rpc.chain.getHeader();
  const account = await api.query.system.account(address);

  await MQ.getMQ().publish(
    "backfill_account",
    Buffer.from(
      JSON.stringify({
        account: { ...account, 0: address },
        blockHash: hash,
      })
    )
  );
  console.log(`Account ${address} successfully passed to queue`);
  api.disconnect();
}

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question(`Input account address to update: `, (address: string) => {
  readline.close();
  updateAccount(address);
});
