/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Resolver, Query, Arg, FieldResolver, Root } from "type-graphql";
import { Block, Event, Extrinsic, Log, RootCertificate, VestingSchedule } from "@nodle/db/index";

import { createBaseResolver } from "../baseResolver";
import { arrayFieldResolver } from "../fieldsResolver";
import DataLoader from "dataloader";
import { Loader } from "type-graphql-dataloader";
import { getRepository, In } from "typeorm";
import { groupBy } from "lodash";

const BlockBaseResolver = createBaseResolver("Block", Block, "number");

@Resolver(Block)
export default class BlockResolver extends BlockBaseResolver {
  @Query(() => Block, { nullable: true })
  async lastFinalizedBlock(): Promise<Block | null> {
    return await Block.findOne({ finalized: true }, { order: { number: "DESC" } });
  }
  @Query(() => Block, { nullable: true })
  async blockByBlockNumber(@Arg("number") number: string): Promise<Block | null> {
    try {
      if (BigInt(number) > Number.MAX_SAFE_INTEGER) {
        // wrong number
        return null;
      }
    } catch (e) {
      // not a number
      return null;
    }
    const block = await Block.findOne({
      number,
    });

    return block;
  }
  @Query(() => Block, { nullable: true })
  async blockByHash(@Arg("hash") hash: string): Promise<Block | null> {
    const block = await Block.findOne({
      hash,
    });

    return block;
  }

  @FieldResolver()
  @Loader<number, Event[]>(async (blockIds) => {
    const events = await getRepository(Event).find({
      where: { blockId: In([...blockIds]) },
    });
    const eventsByBlockId = groupBy(events, "blockId");
    return blockIds.map((blockId) => eventsByBlockId[blockId] ?? ([] as Event[]));
  })
  events(@Root() source: Block) {
    return (dataloader: DataLoader<number, Event[]>) => dataloader.load(source.blockId);
  }

  @FieldResolver()
  @Loader<number, Extrinsic[]>(async (blockIds) => {
    const extrinsics = await getRepository(Extrinsic).find({
      where: { blockId: In([...blockIds]) },
    });
    const extrinsicsByBlockId = groupBy(extrinsics, "blockId");
    return blockIds.map((blockId) => extrinsicsByBlockId[blockId] ?? ([] as Extrinsic[]));
  })
  extrinsics(@Root() source: Block) {
    return (dataloader: DataLoader<number, Extrinsic[]>) => dataloader.load(source.blockId);
  }

  @FieldResolver()
  logs(@Root() source: Block): Promise<Log[]> {
    return arrayFieldResolver(source, Log, "blockId");
  }

  @FieldResolver()
  rootCertificates(@Root() source: Block): Promise<RootCertificate[]> {
    return arrayFieldResolver(source, RootCertificate, "blockId");
  }

  @FieldResolver()
  vestingSchedules(@Root() source: Block): Promise<VestingSchedule[]> {
    return arrayFieldResolver(source, VestingSchedule, "blockId");
  }
}
