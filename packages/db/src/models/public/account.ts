import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn, OneToMany, JoinColumn, OneToOne } from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { TypeormLoader } from "type-graphql-dataloader";
import VestingSchedule from "./vestingSchedule";
import { Application, RootCertificate, Validator } from "..";
import Extrinsic from "./extrinsic";

@ObjectType()
@Index("account_pk", ["accountId"], { unique: true })
@Entity("account", { schema: "public" })
export default class Account extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn({ type: "integer", name: "account_id" })
  public accountId: number;

  @Field(() => String)
  @Column("character varying", { name: "address" })
  public address: string;

  @Field(() => Number, { nullable: true })
  @Column("integer", { name: "nonce", nullable: true })
  public nonce: number;

  @Field(() => Number, { nullable: true })
  @Column("integer", { name: "refcount", nullable: true })
  public refcount: number;

  @Field(() => [VestingSchedule], { nullable: true })
  @OneToMany(() => VestingSchedule, (vestingSchedule) => vestingSchedule.account)
  @JoinColumn([{ name: "account_id", referencedColumnName: "accountId" }])
  @TypeormLoader()
  public vestingSchedules: VestingSchedule[];

  @Field(() => Validator, { nullable: true })
  @OneToOne(() => Validator, (validator) => validator.account)
  @TypeormLoader()
  public validator: Validator;

  @Field(() => [Extrinsic], { nullable: true })
  @OneToMany(() => Extrinsic, (extrinsic) => extrinsic.signer)
  @JoinColumn([{ name: "signer_id", referencedColumnName: "signerId" }])
  @TypeormLoader()
  public extrinsics: Extrinsic[];

  @Field(() => [RootCertificate], { nullable: true })
  @OneToMany(() => RootCertificate, (cert) => cert.owner)
  @JoinColumn([{ name: "owner_id", referencedColumnName: "ownerId" }])
  @TypeormLoader()
  public rootCertificatesByOwner: RootCertificate[];

  @Field(() => [RootCertificate], { nullable: true })
  @OneToMany(() => RootCertificate, (cert) => cert.key)
  @JoinColumn([{ name: "key_id", referencedColumnName: "keyId" }])
  @TypeormLoader()
  public rootCertificatesByKey: RootCertificate[];

  @Field(() => [Application], { nullable: true })
  @OneToMany(() => Application, (app) => app.candidate)
  @JoinColumn([{ name: "candidate_id", referencedColumnName: "candidateId" }])
  @TypeormLoader()
  public applicationsByCandidate: Application[];

  @Field(() => [Application], { nullable: true })
  @OneToMany(() => Application, (app) => app.challenger)
  @JoinColumn([{ name: "challenger_id", referencedColumnName: "challengerId" }])
  @TypeormLoader()
  public applicationsByChallenger: Application[];
}
