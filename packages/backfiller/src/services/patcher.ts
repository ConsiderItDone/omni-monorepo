import { Connection } from "typeorm";
import EventRepository from "@nodle/db/src/repositories/public/eventRepository";

export async function patcher(ws: string, connection: Connection): Promise<void> {
  await patchAllocationData(connection);

  await patchBalances(connection);

  await patchApplications(connection);

  await patchExtrinsics(connection);

  await patchAllocations(connection);

  await patchTransfers(connection);

  process.exit(0);
}

async function patchAllocationData(connection: Connection) {
  const eventRepository = connection.getCustomRepository(EventRepository);

  const allocations = await eventRepository.query(`
      SELECT e.event_id, data FROM "event" e
        LEFT JOIN event_type et ON e.event_type_id = et.event_type_id 
      WHERE
        et."name" = 'NewAllocation' AND e.data->0 is not null
  `);
  console.log("Allocations to patch:", allocations.length);

  for (const allocation of allocations) {
    await eventRepository.update(allocation.event_id, {
      data: {
        who: allocation.data[0],
        value: allocation.data[1],
        fee: allocation.data[2],
        proof: allocation.data[3],
      },
    });
    console.log(`Event ${allocation.event_id} was patched`);
  }

  console.log("Allocations data format were patched");
}

async function patchBalances(connection: Connection) {
  await connection.query(`
      UPDATE "public"."balance"
      SET
        patch_version=1,
        free=free::numeric/100,
        reserved=reserved::numeric/100,
        misc_frozen=misc_frozen::numeric/100,
        fee_frozen=fee_frozen::numeric/100
      WHERE patch_version is null
    `);

  console.log("Balances were patched");
}

async function patchApplications(connection: Connection) {
  await connection.query(`
      UPDATE "public"."application"
      SET
        patch_version=1,
        challenger_deposit=challenger_deposit::numeric/100,
        candidate_deposit=candidate_deposit::numeric/100
      WHERE patch_version is null
    `);

  console.log("Applications were patched");
}

async function patchExtrinsics(connection: Connection) {
  await connection.query(`
    UPDATE "public"."extrinsic"
    SET
      patch_version=1,
      fee = jsonb_set(fee, '{inclusionFee, baseFee}', to_jsonb((fee->'inclusionFee'->'baseFee')::bigint/100), true)
    WHERE patch_version is null
  `);

  await connection.query(`
    UPDATE "public"."extrinsic"
    SET
      patch_version=2,
      fee = jsonb_set(fee, '{inclusionFee, lenFee}', to_jsonb((fee->'inclusionFee'->'lenFee')::bigint/100), true)
    WHERE patch_version = 1
  `);

  console.log("Extrinsics were patched");
}

async function patchAllocations(connection: Connection) {
  await connection.query(`
    UPDATE "public"."event"
    SET
      patch_version=1,
      data = jsonb_set(data, '{fee}',to_jsonb((data->>'fee')::bigint/100), true)
    WHERE patch_version is null and data->'who' is not null
  `);

  await connection.query(`
    UPDATE "public"."event"
    SET
      patch_version=2,
      data = jsonb_set(data, '{value}',to_jsonb((data->>'value')::bigint/100), true)
    WHERE patch_version=1 and data->'who' is not null
  `);

  console.log("Allocations were patched");
}

async function patchTransfers(connection: Connection) {
  // skip patch_version=1 and set v2

  await connection.query(`
    UPDATE "public"."event"
    SET
      patch_version=2,
      data = jsonb_set(data, '{value}',to_jsonb((data->>'value')::bigint/100), true)
    WHERE patch_version is null and data->'from' is not null
  `);

  console.log("Transfers were patched");
}
