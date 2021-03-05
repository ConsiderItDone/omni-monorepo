import { EntityRepository, Repository } from "typeorm";
import Block from "../../models/public/block";

@EntityRepository(Block)
export default class BlockRepository extends Repository<Block> {
  public add({ // TODO: support all fields
    blockId,
    number,
    timestamp,
    hash,
    parentHash,
    stateRoot,
    extrinsicsRoot,
    specVersion,
    finalized,
  }: {
    blockId: number;
    number: number;
    timestamp: number;
    hash: string;
    parentHash: string;
    stateRoot: string;
    extrinsicsRoot: string;
    specVersion: number;
    finalized: boolean;
  }) {
    return this.save({
      blockId,
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
}