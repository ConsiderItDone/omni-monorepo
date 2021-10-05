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
  public async add({ index, type, data, isFinalized, blockId }: NewLogParam): Promise<Log> {
    const log = await this.save({
      index,
      type,
      data,
      isFinalized,
      blockId,
    });

    return log;
  }

  public async addList(list: NewLogParam[]): Promise<Log[]> {
    return await this.save(list);
  }

  public async deleteByBlockId(blockId: number) {
    return this.delete({ blockId });
  }
}
