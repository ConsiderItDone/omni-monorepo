import { Field, ID, ObjectType } from "type-graphql";
import { Index, Column, Entity, BaseEntity, PrimaryGeneratedColumn } from "typeorm";

@ObjectType()
@Index("backfill_progress_pkey", ["backfillProgressId"], { unique: true })
@Entity("backfill_progress", { schema: "public" })
export default class BackfillProgress extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "backfill_progress_id" })
  public backfillProgressId: number;

  @Field(() => String)
  @Column("bigint", { name: "last_block_number" })
  public lastBlockNumber: string;

  @Field(() => Number)
  @Column("integer", { name: "per_page" })
  public perPage: number;
}
