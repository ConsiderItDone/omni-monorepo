import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Field, ObjectType, Int } from "type-graphql";
import { TypeormLoader } from "type-graphql-dataloader";
import Block from "./block";
import Extrinsic from "./extrinsic";
import { GraphQLJSON } from "graphql-type-json";
import EventType from "./eventType";
import Module from "./module";

@ObjectType()
@Index("event_pk", ["eventId"], { unique: true })
@Entity("event", { schema: "public" })
export default class Event extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn({ type: "integer", name: "event_id" })
  public eventId: number;

  @Field(() => Number)
  @Column("smallint", { name: "index" })
  public index: number;

  @Field(() => GraphQLJSON, { nullable: true })
  @Column("jsonb", { name: "data" })
  public data: string | unknown;

  @Field(() => String, { nullable: true })
  @Column("character varying", { name: "extrinsic_hash", nullable: true })
  public extrinsicHash: string | null;

  @Field(() => Int)
  @Column("integer", { name: "module_id", nullable: true })
  public moduleId: number;

  @Field(() => Module, { nullable: true })
  @ManyToOne(() => Module, (m) => m.moduleId)
  @JoinColumn([{ name: "module_id", referencedColumnName: "moduleId" }])
  @TypeormLoader()
  public module: Module;

  @Field(() => Int)
  @Column("integer", { name: "event_type_id", nullable: true })
  public eventTypeId: number;

  @Field(() => EventType, { nullable: true })
  @ManyToOne(() => EventType, (type) => type.eventTypeId)
  @JoinColumn([{ name: "event_type_id", referencedColumnName: "eventTypeId" }])
  @TypeormLoader()
  public eventType: EventType;

  @Field(() => Int)
  @Column("integer", { name: "block_id" })
  public blockId: number;

  @Field(() => Block, { nullable: true })
  @ManyToOne(() => Block, (block) => block.events)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  @TypeormLoader()
  public block: Block;

  @Field(() => Int)
  @Column("integer", { name: "extrinsic_id" })
  public extrinsicId: number;

  @Field(() => Extrinsic, { nullable: true })
  @ManyToOne(() => Extrinsic, (extrinsic) => extrinsic.extrinsicId)
  @JoinColumn([{ name: "extrinsic_id", referencedColumnName: "extrinsicId" }])
  @TypeormLoader()
  public extrinsic: Extrinsic;
}
