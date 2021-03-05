import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";
import Block from "./block";

@ObjectType()
@Index("event_pk", ["eventId"], { unique: true })
@Entity("event", { schema: "public" })
export default class Event extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "event_id" })
  public eventId: number;

  @Field(() => Number)
  @Column("integer", { name: "index" })
  public index: number;

  @Field(() => String)
  @Column("character varying", { name: "type" })
  public type: string;

  @Field(() => String, { nullable: true })
  @Column("character varying", { name: "extrinsic_hash", nullable: true })
  public extrinsicHash: string | null;

  @Field(() => String)
  @Column("character varying", { name: "module_name" })
  public moduleName: string;

  @Field(() => String)
  @Column("character varying", { name: "event_name" })
  public eventName: string;

  @Field(() => Block)
  @ManyToOne(() => Block, block => block.events)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  public block: Block;
}
