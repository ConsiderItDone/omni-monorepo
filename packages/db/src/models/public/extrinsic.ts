import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Field, ID, ObjectType, Int } from "type-graphql";
import Block from "./block";
import { GraphQLJSON } from "graphql-type-json";
import Event from "./event";
import Account from "./account";
import Module from "./module";
import ExtrinsicType from "./extrinsicType";

@ObjectType()
@Index("extrinsic_pk", ["extrinsicId"], { unique: true })
@Entity("extrinsic", { schema: "public" })
export default class Extrinsic extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "extrinsic_id" })
  public extrinsicId: number;

  @Field(() => Number)
  @Column("integer", { name: "index" })
  public index: number;

  @Field(() => Number)
  @Column("integer", { name: "length" })
  public length: number;

  @Field(() => String)
  @Column("character varying", { name: "version_info" })
  public versionInfo: string;

  @Field(() => String)
  @Column("character varying", { name: "call_code" })
  public callCode: string;

  @Field(() => Int)
  @Column("integer", { name: "extrinsic_type_id", nullable: true })
  public extrinsicTypeId: number;

  @Field(() => ExtrinsicType, { nullable: true })
  @ManyToOne(() => ExtrinsicType, (m) => m.extrinsicTypeId)
  @JoinColumn([{ name: "extrinsic_type_id", referencedColumnName: "extrinsicTypeId" }])
  public extrinsicType: ExtrinsicType;

  @Field(() => Int)
  @Column("integer", { name: "module_id", nullable: true })
  public moduleId: number;

  @Field(() => Module, { nullable: true })
  @ManyToOne(() => Module, (m) => m.moduleId)
  @JoinColumn([{ name: "module_id", referencedColumnName: "moduleId" }])
  public module: Module;

  @Field(() => String)
  @Column("text", { name: "params" })
  public params: string;

  @Field(() => Int, { nullable: true })
  @Column("integer", { name: "signer_id", nullable: true })
  public signerId: number;

  @Field(() => Account, { nullable: true })
  @ManyToOne(() => Account, (account) => account.extrinsics)
  @JoinColumn([{ name: "signer_id", referencedColumnName: "accountId" }])
  public signer: Account;

  @Field(() => String, { nullable: true })
  @Column("character varying", {
    name: "signature",
    nullable: true,
    default: null,
  })
  public signature: string | null;

  @Field(() => Number, { nullable: true })
  @Column("integer", { name: "nonce", nullable: true, default: null })
  public nonce: number | null;

  @Field(() => String, { nullable: true })
  @Column("character varying", { name: "era", nullable: true, default: null })
  public era: string | null;

  @Field(() => String)
  @Column("character varying", { name: "hash", length: 66 })
  public hash: string;

  @Field(() => Boolean)
  @Column("boolean", { name: "is_signed", default: () => "false" })
  public isSigned: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  @Column("jsonb", { name: "fee", nullable: true })
  public fee: string | unknown;

  @Field(() => Boolean)
  @Column("boolean", { name: "success", default: () => "false" })
  public success: boolean;

  @Field(() => Int)
  @Column("integer", { name: "block_id" })
  public blockId: number;

  @Field(() => Block, { nullable: true })
  @ManyToOne(() => Block, (block) => block.extrinsics)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  public block: Block;

  @Field(() => [Event], { nullable: true, defaultValue: [] })
  @OneToMany(() => Event, (event) => event.extrinsicId)
  @JoinColumn([{ name: "event_id", referencedColumnName: "eventId" }])
  public events: Event[];
}
