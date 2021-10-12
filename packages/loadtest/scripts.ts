import { getApi } from "@nodle/polkadot/src/api";
import { ACCOUNTS } from "@nodle/test/src/const";
import type { KeyringPair } from "@polkadot/keyring/types";

const initApi = () => getApi(process.env.WS_PROVIDER || "ws://3.217.156.114:9944");

export const submitTransfers = async (
  tester: KeyringPair,
  transferQuantity: number,
  options = { receiver: ACCOUNTS.BOB, amount: 1000000000000 }
) => {
  try {
    const api = await initApi();
    const nonce = (await api.rpc.system.accountNextIndex(tester.address)).toNumber();

    let iteration = 1;
    for (let i = nonce; i < nonce + transferQuantity; i++) {
      const resultHash = await api.tx.balances
        .transfer(options.receiver, options.amount)
        .signAndSend(tester, { nonce: i });
      console.log(iteration++, resultHash.toString());
      //iteration++
    }
  } catch (e) {
    console.error(e);
  }
};

export const submitAllocations = async (
  tester: KeyringPair,
  allocatiobQuantity: number,
  options = { receiver: ACCOUNTS.BOB, amount: 1000000000000 }
) => {
  try {
    const api = await initApi();
    const nonce = (await api.rpc.system.accountNextIndex(tester.address)).toNumber();

    let iteration = 1;
    for (let i = nonce; i < nonce + allocatiobQuantity; i++) {
      const resultHash = await api.tx.allocations
        .allocate(options.receiver, options.amount, "0x00")
        .signAndSend(tester, { nonce: i });
      console.log(iteration++, resultHash.toString());
    }
  } catch (e) {
    console.error(e);
  }
};
