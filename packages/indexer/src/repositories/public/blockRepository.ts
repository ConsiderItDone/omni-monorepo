import { EntityRepository, Repository } from "typeorm";
import Block from "../../models/public/block";

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
    number: number;
    timestamp: Date;
    hash: string;
    parentHash: string;
    stateRoot: string;
    extrinsicsRoot: string;
    specVersion: number;
    finalized: boolean;
  }) {
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