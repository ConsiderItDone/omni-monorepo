import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Field, ID, ObjectType, Int } from "type-graphql";
import { Block, Account } from "../index";

@ObjectType()
@Index("vesting_schedule_pk", ["vestingScheduleId"], { unique: true })
@Entity("vesting_schedule", { schema: "public" })
export default class VestingSchedule extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "vesting_schedule_id" })
  public vestingScheduleId: number;

  @Field(() => String)
  @Column("bigint", { name: "start" })
  public start: string;

  @Field(() => String)
  @Column("bigint", { name: "period" })
  public period: string;

  @Field(() => Number)
  @Column("integer", { name: "period_count" })
  public periodCount: number;

  @Field(() => String)
  @Column("bigint", { name: "per_period", default: () => "0" })
  public perPeriod: string;

  @Field(() => Number)
  @Column("integer", { name: "account_id" })
  public accountId: number;

  @Field(() => Account, { nullable: true })
  @ManyToOne(() => Account, (account) => account.vestingSchedules)
  @JoinColumn([{ name: "account_id", referencedColumnName: "accountId" }])
  public account: Account;

  @Field(() => Int)
  @Column("integer", { name: "block_id" })
  public blockId: number;

  @Field(() => String)
  @Column("character varying", {
    name: "status",
    nullable: true,
    default: "active",
  })
  public status: string;

  @Field(() => Block)
  @ManyToOne(() => Block, (block) => block.blockId)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  public block: Block;
}
