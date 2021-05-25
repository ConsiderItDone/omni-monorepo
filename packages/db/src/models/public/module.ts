import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
@Index("module_pk", ["moduleId"], { unique: true })
@Entity("module", { schema: "public" })
export default class Module extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "module_id" })
  public moduleId: number;

  @Field(() => String)
  @Column("character varying", { name: "name" })
  public name: string;
}
