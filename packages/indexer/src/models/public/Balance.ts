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

@ObjectType()
@Index("balance_pk", ["balanceId"], { unique: true })
@Entity("balance", { schema: "public" })
export default class Balance extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "balance_id" })
  public balanceId: number;

  @Field(() => Number)
  @Column("numeric", { name: "value" })
  public value: number;

  @Field(() => Int)
  @Column("integer", { name: "block_id" })
  public blockId: number;
  
  @Field(() => Block)
  @ManyToOne(() => Block, (block) => block.balances)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  public block: Block;
}
