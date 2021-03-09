import { EntityRepository, Repository } from "typeorm";
import Block from "../../models/public/Block";

@EntityRepository(Block)
export default class BlockRepository extends Repository<Block> {
  public add({ // TODO: support all fields
    number,
    timestamp,
    hash,
    parentHash,
    stateRoot,
    extrinsicsRoot,
    specVersion,
    finalized,
  }: {
    number: string;
    timestamp: Date;
    hash: string;
    parentHash: string;
    stateRoot: string;
    extrinsicsRoot: string;
    specVersion: number;
    finalized: boolean;
  }) : Promise<Block> {
    return this.save({
      number,
      timestamp,
      hash,
      parentHash,
      stateRoot,
      extrinsicsRoot,
      specVersion,
      finalized,
    });
  }

  public findByNumber(number: number) {
    return this.findOne({ where: { number } })
  }
}