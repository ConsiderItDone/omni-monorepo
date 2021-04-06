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
import Block from "./block";
import Extrinsic from "./extrinsic";
import { GraphQLJSON } from "graphql-type-json";

@ObjectType()
@Index("event_pk", ["eventId"], { unique: true })
@Entity("event", { schema: "public" })
export default class Event extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "event_id" })
  public eventId: number;

  @Field(() => Number)
  @Column("smallint", { name: "index" })
  public index: number;

  @Field(() => GraphQLJSON)
  @Column("jsonb", { name: "data" })
  public data: string;

  @Field(() => String, { nullable: true })
  @Column("character varying", { name: "extrinsic_hash", nullable: true }) // TODO check length
  public extrinsicHash: string | null;

  @Field(() => String)
  @Column("character varying", { name: "module_name" })
  public moduleName: string;

  @Field(() => String)
  @Column("character varying", { name: "event_name" })
  public eventName: string;

  @Field(() => Int)
  @Column("integer", { name: "block_id" })
  public blockId: number;

  @Field(() => Block)
  @ManyToOne(() => Block, (block) => block.events)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  public block: Block;

  @Field(() => Int)
  @Column("integer", { name: "extrinsic_id" })
  public extrinsicId: number;

  @Field(() => Extrinsic, { nullable: true })
  @ManyToOne(() => Extrinsic, (extrinsic) => extrinsic.extrinsicId)
  @JoinColumn([{ name: "extrinsic_id", referencedColumnName: "extrinsicId" }])
  public extrinsic: Extrinsic;
}
