import { BaseEntity, Column, Entity, Index, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Field, ID, ObjectType, Int } from "type-graphql";
import Event from './Event'
import Log from './Log'

@ObjectType()
@Index("block_pk", ["blockId"], { unique: true })
@Entity("block", { schema: "public" })
export default class Block extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "block_id" })
  public blockId: number;

  @Field(() => String)
  @Column("bigint", {
    name: "number",
  })
  private number: string;

  @Field(() => Date)
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

  @Field(() => [Event], { nullable: true, defaultValue: [] })
  @OneToMany(() => Event, event => event.block)
  @JoinColumn([{ name: "event_id", referencedColumnName: "eventId" }])
  public events: Event[];

  @Field(() => [Log], { nullable: true, defaultValue: [] })
  @OneToMany(() => Log, log => log.block)
  @JoinColumn([{ name: "log_id", referencedColumnName: "logId" }])
  public logs: Log[];
}
