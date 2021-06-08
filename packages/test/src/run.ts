import { getApi } from "@nodle/polkadot/src/api";
import { ACCOUNTS } from "./const";
import Tester from "./tester";

import { Keyring } from "@polkadot/api";
import { waitReady } from "@polkadot/wasm-crypto";

const keyring = new Keyring({ type: "sr25519" });

async function start() {
  const api = await getApi(
    process.env.WS_PROVIDER || "ws://3.217.156.114:9944"
  );
  const ApiTester = Tester.bind(null, api);

  await waitReady().then(() => {
    const alice = keyring.addFromUri("//Alice", { name: "Alice default" });
    const tester = new ApiTester(alice) as Tester;

    //tester.transfer(ACCOUNTS.BOB, 1234567894325); // 1.2345xxxxxxxx
    tester.bookSlot(ACCOUNTS.BOB)
    
    //tester.allocate(ACCOUNTS.BOB, 1000000000000, "0x00");
    //tester.apply('0x00', 10234567894325)
  });
}

start();
