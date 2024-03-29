import { BaseEntity, Column, Entity, Index, OneToMany, PrimaryGeneratedColumn, JoinColumn, Unique } from "typeorm";
import { Field, GraphQLTimestamp, Int, ObjectType } from "type-graphql";
import { TypeormLoader } from "type-graphql-dataloader";
import Event from "./event";
import Log from "./log";
import Extrinsic from "./extrinsic";
import RootCertificate from "./rootCertificate";
import VestingSchedule from "./vestingSchedule";
import Balance from "./balance";

@ObjectType()
@Index("block_pk", ["blockId"], { unique: true })
@Entity("block", { schema: "public" })
@Unique(["number"])
export default class Block extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn({ type: "integer", name: "block_id" })
  public blockId: number;

  @Field(() => String || Number)
  @Column("bigint", {
    name: "number",
    unique: true,
  })
  public number: string | number;

  @Field(() => GraphQLTimestamp)
  @Column("timestamp without time zone", { name: "timestamp" })
  public timestamp: Date;

  @Field(() => String)
  @Column("character varying", { name: "hash", length: 66 })
  public hash: string;

  @Field(() => String) // One to one relation ???
  @Column("character varying", { name: "parent_hash", length: 66 })
  public parentHash: string;

  @Field(() => String)
  @Column("character varying", { name: "state_root", length: 66 })
  public stateRoot: string;

  @Field(() => String)
  @Column("character varying", { name: "extrinsics_root", length: 66 })
  public extrinsicsRoot: string;

  @Field(() => Number)
  @Column("integer", { name: "spec_version" })
  public specVersion: number;

  @Field(() => Boolean)
  @Column("boolean", { name: "finalized", default: () => false })
  public finalized: boolean;

  @Field(() => [Balance], { nullable: true })
  @OneToMany(() => Balance, (balance) => balance.block)
  @JoinColumn([{ name: "balance_id", referencedColumnName: "balanceId" }])
  @TypeormLoader()
  public balances: Balance[];

  @Field(() => [Event], { nullable: true, defaultValue: [] })
  @OneToMany(() => Event, (event) => event.block)
  @JoinColumn([{ name: "event_id", referencedColumnName: "eventId" }])
  @TypeormLoader()
  public events: Event[];

  @Field(() => [Log], { nullable: true, defaultValue: [] })
  @OneToMany(() => Log, (log) => log.block)
  @JoinColumn([{ name: "log_id", referencedColumnName: "logId" }])
  @TypeormLoader()
  public logs: Log[];

  @Field(() => [Extrinsic], { nullable: true, defaultValue: [] })
  @OneToMany(() => Extrinsic, (extrinsic) => extrinsic.block)
  @JoinColumn([{ name: "extrinsic_id", referencedColumnName: "extrinsicId" }])
  @TypeormLoader()
  public extrinsics: Extrinsic[];

  @Field(() => [RootCertificate], { nullable: true })
  @OneToMany(() => RootCertificate, (rootCertificate) => rootCertificate.block)
  @JoinColumn([{ name: "rootCertificate_id", referencedColumnName: "rootCertificateId" }])
  @TypeormLoader()
  public rootCertificates: RootCertificate[];

  /*   @Field(() => [Balance], { nullable: true, defaultValue: null })
  @OneToMany(() => Balance, (balance) => balance.block)
  @JoinColumn([{ name: "balance_id", referencedColumnName: "balanceId" }])
  public balances: Balance[]; */

  @Field(() => [VestingSchedule], { nullable: true, defaultValue: null })
  @OneToMany(() => VestingSchedule, (vestingSchedule) => vestingSchedule.block)
  @JoinColumn([{ name: "vestingSchedule_id", referencedColumnName: "vestingScheduleId" }])
  @TypeormLoader()
  public vestingSchedules: VestingSchedule[];
}
