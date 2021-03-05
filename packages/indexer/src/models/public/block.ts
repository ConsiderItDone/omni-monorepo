import {BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn} from "typeorm";
import {Field, ID, ObjectType} from "type-graphql";

@ObjectType()
@Index("block_pk", ["blockId"], { unique: true })
@Entity("block", { schema: "public" })
export default class Block extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "block_id" })
  public blockId: number;

  @Field(() => Number)
  @Column("integer", { name: "number" })
  public number: number;

  @Field(() => Date)
  @Column("integer", { name: "timestamp" })
  public timestamp: number; // TODO: Date

  @Field(() => String)
  @Column("character varying", { name: "hash" })
  public hash: string;

  @Field(() => String)
  @Column("character varying", { name: "parent_hash" })
  public parentHash: string;

  @Field(() => String)
  @Column("character varying", { name: "state_root" })
  public stateRoot: string;

  @Field(() => String)
  @Column("character varying", { name: "extrinsics_root" })
  public extrinsicsRoot: string;

  @Field(() => Number)
  @Column("integer", { name: "spec_version" })
  public specVersion: number;

  @Field(() => Boolean)
  @Column("boolean", { name: "finalized", default: () => "false" })
  public finalized: boolean;
}
