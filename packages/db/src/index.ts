import { ConnectionOptions, createConnection, Connection } from "typeorm";

export { default as BlockRepository } from "./repositories/public/blockRepository";
export { default as EventRepository } from "./repositories/public/eventRepository";
export { default as EventTypeRepository } from "./repositories/public/eventTypeRepository";
export { default as ModuleRepository } from "./repositories/public/moduleRepository";
export { default as ExtrinsicRepository } from "./repositories/public/extrinsicRepository";
export { default as ExtrinsicTypeRepository } from "./repositories/public/extrinsicTypeRepository";
export { default as LogRepository } from "./repositories/public/logRepository";
export { default as RootCertificateRepository } from "./repositories/public/rootCertificateRepository";
export { default as VestingScheduleRepository } from "./repositories/public/vestingScheduleRepository";
export { default as ApplicationRepository } from "./repositories/public/applicationRepository";
export { default as AccountRepository } from "./repositories/public/accountRepository";
export { default as ValidatorRepository } from "./repositories/public/validatorRepository";
export { default as BalanceRepository } from "./repositories/public/balanceRepository";
export { default as VoteRepository } from "./repositories/public/voteRepository";
export { default as BackfillProgressRepository } from "./repositories/public/backfillProgressRepository";

export { default as Account } from "./models/public/account";
export { default as Application } from "./models/public/application";
export { default as Balance } from "./models/public/balance";
export { default as Block } from "./models/public/block";
export { default as Event } from "./models/public/event";
export { default as Extrinsic } from "./models/public/extrinsic";
export { default as ExtrinsicType } from "./models/public/extrinsicType";
export { default as Log } from "./models/public/log";
export { default as RootCertificate } from "./models/public/rootCertificate";
export { default as VestingSchedule } from "./models/public/vestingSchedule";
export { default as Validator } from "./models/public/validator";
export { default as BackfillProgress } from "./models/public/backfillProgress";
export { default as Vote } from "./models/public/vote";
export { default as Module } from "./models/public/module";
export { default as EventType } from "./models/public/eventType";

export async function connect(connectionOptions: ConnectionOptions): Promise<Connection> {
  const connection = await createConnection(connectionOptions);
  return connection;
}
