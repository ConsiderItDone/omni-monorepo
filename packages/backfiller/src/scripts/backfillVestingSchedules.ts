import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../../.env" });
} catch (e) {
  //nop
}

import { getApi } from "@nodle/polkadot";
import { EventRepository, EventTypeRepository } from "@nodle/db";
import { connect } from "@nodle/db";
import { connectionOptions, backfillVestingSchedules } from "../utils";

async function run(): Promise<void> {
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
    await backfillVestingSchedules(account, api, connection);
  }
  console.log(`Vesting schedules backfiller finished`);
  return;
}

run();
