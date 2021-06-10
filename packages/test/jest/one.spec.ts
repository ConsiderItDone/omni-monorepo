import { expect } from "@jest/globals";
import { getApi } from "@nodle/polkadot/src/api";
import { ACCOUNTS } from "../src/const";
import Tester from "../src/tester";

import { Keyring } from "@polkadot/api";
import { waitReady } from "@polkadot/wasm-crypto";

const keyring = new Keyring({ type: "sr25519" });

describe("Preparation", () => {
  let tester: Tester;
  beforeAll(async () => {
    const api = await getApi(
      process.env.WS_PROVIDER || "ws://3.217.156.114:9944"
    );
    waitReady().then(() => {
      const alice = keyring.addFromUri("//Alice", { name: "Alice default" });
      tester = new Tester(api, alice);
    });
  });
  /* tester.transfer(ACCOUNTS.BOB, 1234567894325); // 1.2345xxxxxxxx
    //tester.bookSlot(ACCOUNTS.BOB)

    //tester.allocate(ACCOUNTS.BOB, 1000000000000, "0x00");
    //tester.apply('0x00', 10234567894325)
  }); */

  it("Transfer extrinsic should be written to DB", async () => {
    await tester.transfer(ACCOUNTS.BOB, 1234567894325);
    expect(tester).toHaveProperty("sender");
  });
  return;
});
