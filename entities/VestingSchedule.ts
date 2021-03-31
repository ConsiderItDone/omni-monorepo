import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Block } from "./Block";

@Index("vesting_schedule_pk", ["vestingScheduleId"], { unique: true })
@Entity("vesting_schedule", { schema: "public" })
export class VestingSchedule {
  @PrimaryGeneratedColumn({ type: "integer", name: "vesting_schedule_id" })
  vestingScheduleId: number;

  @Column("bigint", { name: "start" })
  start: string;

  @Column("bigint", { name: "period" })
  period: string;

  @Column("integer", { name: "period_count" })
  periodCount: number;

  @Column("bigint", { name: "per_period", default: () => "0" })
  perPeriod: string;

  @Column("character varying", { name: "account_address" })
  accountAddress: string;

  @Column("character varying", { name: "status", nullable: true })
  status: string | null;

  @ManyToOne(() => Block, (block) => block.vestingSchedules)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  block: Block;
}
