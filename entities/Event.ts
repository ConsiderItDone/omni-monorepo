import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Block } from "./Block";

@Index("event_pk", ["eventId"], { unique: true })
@Index("PK_2403d4f25e3671e42901eb1a2f2", ["eventId"], { unique: true })
@Entity("event", { schema: "public" })
export class Event {
  @PrimaryGeneratedColumn({ type: "integer", name: "event_id" })
  eventId: number;

  @Column("smallint", { name: "index" })
  index: number;

  @Column("character varying", { name: "extrinsic_hash", nullable: true })
  extrinsicHash: string | null;

  @Column("character varying", { name: "module_name" })
  moduleName: string;

  @Column("character varying", { name: "event_name" })
  eventName: string;

  @Column("jsonb", { name: "data", nullable: true })
  data: object | null;

  @Column("character varying", { name: "type", nullable: true })
  type: string | null;

  @Column("integer", { name: "extrinsic_id", nullable: true })
  extrinsicId: number | null;

  @ManyToOne(() => Block, (block) => block.events)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  block: Block;
}
