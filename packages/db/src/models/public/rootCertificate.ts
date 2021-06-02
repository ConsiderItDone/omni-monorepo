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
import Account from "./account";

@ObjectType()
@Index("root_certificate_pk", ["rootCertificateId"], { unique: true })
@Entity("root_certificate", { schema: "public" })
export default class RootCertificate extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "root_certificate_id" })
  public rootCertificateId: number;

  @Field(() => Int)
  @Column("integer", { name: "owner_id", nullable: true })
  public ownerId: number;

  @Field(() => Account, { nullable: true })
  @ManyToOne(() => Account, (account) => account.accountId)
  @JoinColumn([{ name: "owner_id", referencedColumnName: "accountId" }])
  public owner: Account;

  @Field(() => Int)
  @Column("integer", { name: "key_id", nullable: true })
  public keyId: number;

  @Field(() => Account, { nullable: true })
  @ManyToOne(() => Account, (account) => account.accountId)
  @JoinColumn([{ name: "key_id", referencedColumnName: "accountId" }])
  public key: Account;

  @Field(() => String)
  @Column("bigint", { name: "created" })
  public created: string;

  @Field(() => String)
  @Column("bigint", { name: "renewed" })
  public renewed: string;

  @Field(() => Boolean)
  @Column("boolean", { name: "revoked", default: () => "false" })
  public revoked: boolean;

  @Field(() => Number)
  @Column("integer", { name: "validity" })
  public validity: number;

  @Field(() => [String], { nullable: true, defaultValue: [] })
  @Column("varchar", { name: "child_revocations", nullable: true, array: true })
  public childRevocations: string[] | null;

  @Field(() => Int)
  @Column("integer", { name: "block_id" })
  public blockId: number;

  @Field(() => Block, { nullable: true })
  @ManyToOne(() => Block, (block) => block.rootCertificates)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  public block: Block;
}
