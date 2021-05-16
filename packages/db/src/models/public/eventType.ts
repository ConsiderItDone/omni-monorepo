import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
@Index("event_type_pk", ["eventTypeId"], { unique: true })
@Entity("event_type", { schema: "public" })
export default class EventType extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "event_type_id" })
  public eventTypeId: number;

  @Field(() => String)
  @Column("character varying", { name: "name" })
  public name: string;
}
