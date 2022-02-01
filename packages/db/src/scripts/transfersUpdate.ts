import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../../.env" });
} catch (e) {
  //nop
}
import { ConnectionOptions, MoreThanOrEqual } from "typeorm";
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

async function start() {
  const connection = await connect(connectionOptions);
  const eventRepository = connection.getCustomRepository(EventRepository);

  //38007418 - first transfer event id on upgraded polkadot-api 
  const transferEvents = await eventRepository.find({
    where: { eventTypeId: 35, moduleId: 5, eventId: MoreThanOrEqual(38007418) },
  });

  for (const transfer of transferEvents) {
    const [from, to, value] = transfer.data as [string, string, string];
    console.log("transfer", transfer);
    const transferNew = { ...transfer, data: { from, to, value: value.split(",").join("") } };
    console.log("transferNew", transferNew);
    const saved = await eventRepository.save(transferNew);
    console.log("saved", saved);
  }
  console.log('Update complete')
}

start();
