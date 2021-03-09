import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Field, ID, ObjectType, Int } from "type-graphql";
import Block from "./Block";

@ObjectType()
@Index("log_pk", ["logId"], { unique: true })
@Entity("log", { schema: "public" })
export default class Log extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "log_id" })
  public logId: number;

  @Field(() => Number)
  @Column("integer", { name: "index" })
  public index: number;

  @Field(() => String)
  @Column("character varying", { name: "type" })
  public type: string;

  @Field(() => String)
  @Column("text", { name: "data" })
  public data: string;

  @Field(() => Boolean)
  @Column("boolean", { name: "is_finalized", default: () => "false" })
  public isFinalized: boolean;

  @Field(() => Int)
  @Column("integer", { name: "block_id" })
  public blockId: number;

  @Field(() => Block)
  @ManyToOne(() => Block, block => block.logs)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  public block: Block;
}
