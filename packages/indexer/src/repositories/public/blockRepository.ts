import { EntityRepository, Repository } from "typeorm";
import Block from "../../models/public/block";
import Event from "../../models/public/event";

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
    // events,
  }: {
    number: string;
    timestamp: Date;
    hash: string;
    parentHash: string;
    stateRoot: string;
    extrinsicsRoot: string;
    specVersion: number;
    finalized: boolean;
    // events: Event[];
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
      // events,
    });
  }
}