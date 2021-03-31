import { Field } from "type-graphql";
import { Index, Column, Entity, BaseEntity } from "typeorm";

@Index("backfill_progress_pkey", ["backfillProgressId"], { unique: true })
@Entity("backfill_progress", { schema: "public" })
export default class BackfillProgress extends BaseEntity {
  @Field(()=> Number)
  @Column("integer", { primary: true, name: "backfill_progress_id" })
  public backfillProgressId: number;

  @Field(()=> String)
  @Column("bigint", { name: "last_block_number" })
  public lastBlockNumber: string;
}
