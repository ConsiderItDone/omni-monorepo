import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Field, ObjectType, Int } from "type-graphql";
import { TypeormLoader } from "type-graphql-dataloader";
import Block from "./block";

@ObjectType()
@Index("log_pk", ["logId"], { unique: true })
@Entity("log", { schema: "public" })
export default class Log extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn({ type: "integer", name: "log_id" })
  public logId: number;

  @Field(() => String)
  @Column("character varying", { name: "index" })
  public index: string;

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

  @Field(() => Block, { nullable: true })
  @ManyToOne(() => Block, (block) => block.logs)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  @TypeormLoader()
  public block: Block;
}
