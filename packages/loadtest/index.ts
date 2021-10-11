import { getApi } from "@nodle/polkadot/src/api";
import Tester from "@nodle/test/src/tester";

import { Keyring } from "@polkadot/api";
import { waitReady } from "@polkadot/wasm-crypto";
import { submitAllocations, submitTransfers } from "./scripts";

const keyring = new Keyring({ type: "sr25519" });

const modes: { [key: string]: (tester: Tester, transactionQuantity: number) => void } = {
  transfer: submitTransfers,
  allocation: submitAllocations,
};

async function start() {
  const api = await getApi(process.env.WS_PROVIDER || "ws://3.217.156.114:9944");

  waitReady().then(() => {
    const alice = keyring.addFromUri("//Alice", { name: "Alice default" });
    const tester = new Tester(api, alice) as Tester;

    modes[process.argv[2]](tester, 100);
  });
}

start();
