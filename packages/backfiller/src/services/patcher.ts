import { Connection } from "typeorm";
import { EventRepository } from "@nodle/db";

export async function patcher(ws: string, connection: Connection): Promise<void> {
  const eventRepository = connection.getCustomRepository(EventRepository);
  await patchAllocationData(eventRepository);
}

async function patchAllocationData(eventRepository: EventRepository) {
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

  process.exit(0);
}
