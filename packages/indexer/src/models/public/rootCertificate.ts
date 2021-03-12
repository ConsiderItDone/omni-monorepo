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
@Index("root_certificate_pk", ["rootCertificateId"], { unique: true })
@Entity("root_certificate", { schema: "public" })
export default class RootCertificate extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "root_certificate_id" })
  public rootCertificateId: number;

  @Field(() => String)
  @Column("character varying", { name: "owner" })
  public owner: string;

  @Field(() => String)
  @Column("character varying", { name: "key" })
  public key: string;

  @Field(() => Date)
  @Column("timestamp without time zone", { name: "created" })
  public created: Date;

  @Field(() => Date)
  @Column("timestamp without time zone", { name: "renewed" })
  public renewed: Date;

  @Field(() => Boolean)
  @Column("boolean", { name: "revoked", default: () => "false" })
  public revoked: boolean;

  @Field(() => [String], { nullable: true, defaultValue: [] })
  @Column("varchar", { name: "child_revocations", nullable: true, array: true })
  public childRevocations: string[] | null;

  @Field(() => Int)
  @Column("integer", { name: "block_id" })
  public blockId: number;

  @Field(() => Block)
  @ManyToOne(() => Block, (block) => block.rootCertificates)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  public block: Block;
}
