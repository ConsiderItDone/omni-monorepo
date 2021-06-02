import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import Module from "./module";

@ObjectType()
@Index("extrinsic_type_pk", ["extrinsicTypeId"], { unique: true })
@Entity("extrinsic_type", { schema: "public" })
export default class ExtrinsicType extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn({ type: "integer", name: "extrinsic_type_id" })
  public extrinsicTypeId: number;

  @Field(() => String)
  @Column("character varying", { name: "name" })
  public name: string;

  @Field(() => Int)
  @Column("integer", { name: "module_id", nullable: true })
  public moduleId: number;

  @Field(() => Module, { nullable: true })
  @ManyToOne(() => Module, (m) => m.moduleId)
  @JoinColumn([{ name: "module_id", referencedColumnName: "moduleId" }])
  public module: Module;
}
