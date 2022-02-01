import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../../.env" });
} catch (e) {
  //nop
}

import { getApi } from "@nodle/polkadot";
import { MQ, VestingScheduleOf } from "@nodle/utils";
import { AccountRepository, BlockRepository, VestingScheduleRepository } from "@nodle/db";
import { ConnectionOptions } from "typeorm";
import {
  connect,
  Account,
  Application,
  Balance,
  Block,
  Event,
  Extrinsic,
  ExtrinsicType,
  Log,
  RootCertificate,
  VestingSchedule,
  Validator,
  BackfillProgress,
  Vote,
  Module,
  EventType,
} from "@nodle/db";
import * as readline from "readline";

const connectionOptions = {
  name: "default",
  type: "postgres",
  host: process.env.TYPEORM_HOST,
  port: Number(process.env.TYPEORM_PORT),
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  logging: process.env.TYPEORM_LOGGING === "true",
  entities: [
    Account,
    Application,
    Balance,
    Block,
    Event,
    Extrinsic,
    ExtrinsicType,
    Log,
    RootCertificate,
    VestingSchedule,
    Validator,
    BackfillProgress,
    Vote,
    Module,
    EventType,
  ],
} as ConnectionOptions;

async function updateVestingSchedules(address: string) {
  console.log(`Updating Vesting Schedules for '${address}'`);
  const api = await getApi(process.env.WS_PROVIDER);

  const connection = await connect(connectionOptions);

  const grants = ((await api.query.vesting.vestingSchedules(address)) as undefined) as VestingScheduleOf[];
  console.log("Grants:", grants);

  if (grants) {
    const { blockId } = await connection.getCustomRepository(BlockRepository).findOne({ order: { number: "DESC" } });
    const accountRepository = await connection.getCustomRepository(AccountRepository);
    const vestingScheduleRepository = await connection.getCustomRepository(VestingScheduleRepository);

    const account = await accountRepository.findOne({ where: { address: address } });
    if (account) {
      const { accountId } = account;
      await vestingScheduleRepository.removeSchedulesByAccount(1);

      for (const grant of grants) {
        //@ts-ignore
        const { start, period, periodCount, perPeriod } = grant;

        const saved = await vestingScheduleRepository.add({
          accountId,
          start: start.toString(),
          period: period.toString(),
          periodCount: Number(periodCount.toString()),
          perPeriod: perPeriod.toString(),
          blockId,
        });
        console.log("Saved", saved);
      }
    }
  }
}

const r = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

r.question(`Input account address to update Vesting schedules: `, async (address: string) => {
  r.close();
  // init MQ connection
  await MQ.init(process.env.RABBIT_MQ_URL);

  await updateVestingSchedules(address);
});
