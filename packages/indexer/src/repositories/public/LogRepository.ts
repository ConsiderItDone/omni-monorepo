import { EntityRepository, Repository } from "typeorm";
import Log from "../../models/public/Log";

@EntityRepository(Log)
export default class LogRepository extends Repository<Log> {
  public add({
    index,
    type,
    data,
    isFinalized,
    blockId,
  }: {
    index: number,
    type: string,
    data: string,
    isFinalized: boolean,
    blockId: number,
  }) {
    return this.save({
      index,
      type,
      data,
      isFinalized,
      blockId,
    });
  }
}