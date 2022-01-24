import { getApi } from "@nodle/polkadot/index";
import { ACCOUNTS } from "./const";
import Tester from "./tester";

import { Keyring } from "@polkadot/api";
import { waitReady } from "@polkadot/wasm-crypto";

const keyring = new Keyring({ type: "sr25519" });

async function start() {
  const api = await getApi(process.env.WS_PROVIDER || "ws://3.217.156.114:9944");

  waitReady().then(() => {
    const alice = keyring.addFromUri("//Alice", { name: "Alice default" });
    const tester = new Tester(api, alice) as Tester;

    tester.allocate(ACCOUNTS.BOB, 1000000000000, "0x00"); // 1.2345xxxxxxxx
    //tester.bookSlot(ACCOUNTS.BOB)

    //tester.allocate(ACCOUNTS.BOB, 1000000000000, "0x00");
    //tester.apply('0x00', 10234567894325)
  });
}

start();
