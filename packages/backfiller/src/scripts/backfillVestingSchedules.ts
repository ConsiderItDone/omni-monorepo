import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../../.env" });
} catch (e) {
  //nop
}

import { getApi } from "@nodle/polkadot";
import { EventRepository, EventTypeRepository } from "@nodle/db";
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
import { updateVestingSchedules } from "./updateVestingSchedules";

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

async function backfillVestingSchedules(): Promise<void> {
  console.log(`Backfilling Vesting Schedules started`);

  const connection = await connect(connectionOptions);
  const eventRepository = connection.getCustomRepository(EventRepository);
  const eventTypeRepository = connection.getCustomRepository(EventTypeRepository);

  const api = await getApi(process.env.WS_PROVIDER);
  const eventIds = await eventTypeRepository.find({
    where: [{ name: "VestingScheduleAdded" }, { name: "VestingOverwritten" }],
  });

  const vestingEvents = await eventRepository.find({
    where: [...eventIds.map((eventTypeId) => ({ eventTypeId: eventTypeId }))],
  });

  const accounts = vestingEvents.map(({ data }: { data: { to?: string; who?: string } }) => data?.to || data?.who);
  console.log(`Received ${accounts.length} accounts`);

  for await (const account of accounts) {
    await updateVestingSchedules(account, api, connection);
  }
  console.log(`Vesting schedules backfiller finished`);
  return;
}

backfillVestingSchedules();

export default backfillVestingSchedules;
