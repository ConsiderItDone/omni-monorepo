import { BaseEntity, Column, Entity, Index, JoinColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
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
  @Column("character varying", { name: "name" })
  public name: string;

  @Field(() => [EventType], { nullable: true, defaultValue: [] })
  @OneToMany(() => EventType, (type) => type.module)
  @JoinColumn([{ name: "module_id", referencedColumnName: "moduleId" }])
  public eventTypes: EventType[];

  @Field(() => [ExtrinsicType], { nullable: true, defaultValue: [] })
  @OneToMany(() => ExtrinsicType, (type) => type.module)
  @JoinColumn([{ name: "module_id", referencedColumnName: "moduleId" }])
  public extrinsicTypes: ExtrinsicType[];
}
