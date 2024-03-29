import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../../.env" });
} catch (e) {
  //nop
}
import { ConnectionOptions, MoreThan } from "typeorm";
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
  ssl: {
    ca: process.env.TYPEORM_SSL_CA,
    cert: process.env.TYPEORM_SSL_CERT,
    key: process.env.TYPEORM_SSL_KEY,
    rejectUnauthorized: false,
  },
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

  //38008431 - first event id on upgraded polkadot-api
  let lastAllocationId = 38008430;
  //eslint-disable-next-line
  while (true) {
    const allocationEvents = await eventRepository.find({
      where: { eventTypeId: 26, eventId: MoreThan(lastAllocationId) },
      order: { eventId: "ASC" },
      take: 1000,
    });
    console.log("Allocations taken: ", allocationEvents.length);

    if (!allocationEvents.length) {
      break;
    }

    for (const allocation of allocationEvents as Allocation[]) {
      const {
        data: { fee, value },
      } = allocation;

      const newAllocation = {
        ...allocation,
        data: {
          ...allocation.data,
          fee: fee.split(",").join(""),
          value: value.split(",").join(""),
        },
      };
      const saved = await eventRepository.save(newAllocation);
      console.log("Rewriten", saved.eventId);
    }
    lastAllocationId = allocationEvents[allocationEvents.length - 1].eventId;
    console.log("Page updated");
  }
  return;
}

start();
