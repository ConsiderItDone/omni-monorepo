import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Event } from "./Event";
import { Extrinsic } from "./Extrinsic";
import { Log } from "./Log";
import { RootCertificate } from "./RootCertificate";
import { VestingSchedule } from "./VestingSchedule";

@Index("PK_042f4b488f715ee1c97853a4a74", ["blockId"], { unique: true })
@Index("block_pk", ["blockId"], { unique: true })
@Index("bn_index", ["number"], { unique: true })
@Entity("block", { schema: "public" })
export class Block {
  @PrimaryGeneratedColumn({ type: "integer", name: "block_id" })
  blockId: number;

  @Column("bigint", { name: "number" })
  number: string;

  @Column("timestamp without time zone", { name: "timestamp" })
  timestamp: Date;

  @Column("character varying", { name: "hash", length: 66 })
  hash: string;

  @Column("character varying", { name: "parent_hash", length: 66 })
  parentHash: string;

  @Column("character varying", { name: "state_root", length: 66 })
  stateRoot: string;

  @Column("character varying", { name: "extrinsics_root", length: 66 })
  extrinsicsRoot: string;

  @Column("integer", { name: "spec_version" })
  specVersion: number;

  @Column("boolean", { name: "finalized", default: () => "false" })
  finalized: boolean;

  @OneToMany(() => Event, (event) => event.block)
  events: Event[];

  @OneToMany(() => Extrinsic, (extrinsic) => extrinsic.block)
  extrinsics: Extrinsic[];

  @OneToMany(() => Log, (log) => log.block)
  logs: Log[];

  @OneToMany(() => RootCertificate, (rootCertificate) => rootCertificate.block)
  rootCertificates: RootCertificate[];

  @OneToMany(() => VestingSchedule, (vestingSchedule) => vestingSchedule.block)
  vestingSchedules: VestingSchedule[];
}
