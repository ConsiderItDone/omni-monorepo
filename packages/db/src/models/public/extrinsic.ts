import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Field, ID, ObjectType, Int } from "type-graphql";
import Block from "./block";
import Event from "./event";

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

  @Field(() => String)
  @Column("character varying", { name: "call_module_function" })
  public callModuleFunction: string;

  @Field(() => String)
  @Column("character varying", { name: "call_module" })
  public callModule: string;

  @Field(() => String)
  @Column("text", { name: "params" })
  public params: string;

  @Field(() => Int)
  @Column("integer", { name: "signer_id" })
  public signerId: number;

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
