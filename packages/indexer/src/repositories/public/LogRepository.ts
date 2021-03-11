import { EntityRepository, Repository } from "typeorm";
import Log from "../../models/public/log";

type NewLogParam = {
  index: string;
  type: string;
  data: string;
  isFinalized: boolean;
  blockId: number;
};

@EntityRepository(Log)
export default class LogRepository extends Repository<Log> {
  public add({ index, type, data, isFinalized, blockId }: NewLogParam) {
    return this.save({
      index,
      type,
      data,
      isFinalized,
      blockId,
    });
  }

  public addList(list: NewLogParam[]) {
    return this.save(list);
  }
}
