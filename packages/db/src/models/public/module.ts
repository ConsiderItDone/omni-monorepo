import { BaseEntity, Column, Entity, Index, JoinColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { TypeormLoader } from "type-graphql-dataloader";
import EventType from "./eventType";
import ExtrinsicType from "./extrinsicType";

@ObjectType()
@Index("module_pk", ["moduleId"], { unique: true })
@Entity("module", { schema: "public" })
export default class Module extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn({ type: "integer", name: "module_id" })
  public moduleId: number;

  @Field(() => String)
  @Column("character varying", { name: "name", unique: true })
  public name: string;

  @Field(() => [EventType], { nullable: true, defaultValue: [] })
  @OneToMany(() => EventType, (type) => type.module)
  @JoinColumn([{ name: "module_id", referencedColumnName: "moduleId" }])
  @TypeormLoader()
  public eventTypes: EventType[];

  @Field(() => [ExtrinsicType], { nullable: true, defaultValue: [] })
  @OneToMany(() => ExtrinsicType, (type) => type.module)
  @JoinColumn([{ name: "module_id", referencedColumnName: "moduleId" }])
  @TypeormLoader()
  public extrinsicTypes: ExtrinsicType[];
}
