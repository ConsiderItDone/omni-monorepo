import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../../.env" });
} catch (e) {
  //nop
}
import { ConnectionOptions, MoreThan, MoreThanOrEqual } from "typeorm";
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
  EventRepository,
} from "..";

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
interface Allocation extends Event {
  data: {
    fee: string;
    value: string;
  };
}
async function start() {
  const connection = await connect(connectionOptions);
  const eventRepository = connection.getCustomRepository(EventRepository);

  let lastAllocationId = 38008430;
  //eslint-disable-next-line
  while (true) {
    //38007418 - first transfer event id on upgraded polkadot-api
    const allocationEvents = await eventRepository.find({
      where: { eventTypeId: 26, eventId: MoreThan(lastAllocationId) },
      order: { eventId: "ASC" },
      take: 10,
    });
    if (!allocationEvents.length) {
      break;
    }
    for (const allocation of [allocationEvents.pop()] as Allocation[]) {
      console.log("allocation", allocation);
      const newAllocation = {
        ...allocation,
        data: {
          ...allocation.data,
          fee: allocation.data.fee.split(",").join(""),
          value: allocation.data.value.split(",").join(""),
        },
      };

      console.log("newAllocation", newAllocation);
    }
    lastAllocationId = allocationEvents[allocationEvents.length - 1].eventId;
    console.log("Page updated");
    break;
  }
  return;
}

start();
