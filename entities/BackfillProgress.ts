import { Column, Entity, Index } from "typeorm";

@Index("backfill_progress_pkey", ["backfillProgressId"], { unique: true })
@Entity("backfill_progress", { schema: "public" })
export class BackfillProgress {
  @Column("integer", { primary: true, name: "backfill_progress_id" })
  backfillProgressId: number;

  @Column("bigint", { name: "last_block_number" })
  lastBlockNumber: string;
}
