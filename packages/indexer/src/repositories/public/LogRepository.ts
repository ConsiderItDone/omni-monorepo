import { EntityRepository, Repository } from "typeorm";
import Log from "../../models/public/log";
import MQ from "../../mq";

type NewLogParam = {
  index: string;
  type: string;
  data: string;
  isFinalized: boolean;
  blockId: number;
};

@EntityRepository(Log)
export default class LogRepository extends Repository<Log> {
  public async add({ index, type, data, isFinalized, blockId }: NewLogParam) {
    const log = await this.save({
      index,
      type,
      data,
      isFinalized,
      blockId,
    });

    MQ.getMQ().emit("newLog", log);

    return log;
  }

  public async addList(list: NewLogParam[]) {
    const logs = await this.save(list);
    for (const log of logs) {
      MQ.getMQ().emit("newLog", log);
    }

    return logs;
  }
}
