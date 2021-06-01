import { EntityManager } from "typeorm";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { EventRecord, Event } from "@polkadot/types/interfaces/system";
import type { Vec } from "@polkadot/types";

import EventRepository from "@nodle/db/src/repositories/public/eventRepository";
import ExtrinsicRepository from "@nodle/db/src/repositories/public/extrinsicRepository";
import {
  findExtrinsicsWithEventsHash,
  transformEventData,
} from "@nodle/polkadot/src/misc";
import {
  ExtrinsicWithBoundedEvents,
  CustomEventSection,
} from "@nodle/utils/src/types";
import {
  logger,
  LOGGER_INFO_CONST,
  LOGGER_ERROR_CONST,
} from "@nodle/utils/src/logger";
import { default as EventModel } from "@nodle/db/src/models/public/event";
import EventTypeRepository from "@nodle/db/src/repositories/public/eventTypeRepository";
import ModuleRepository from "@nodle/db/src/repositories/public/moduleRepository";

export async function handleEvents(
  manager: EntityManager,
  events: Vec<EventRecord>,
  extrinsicsWithBoundedEvents: ExtrinsicWithBoundedEvents[],
  blockId: number,
  blockNumber: BlockNumber
): Promise<[EventModel[], Event[]]> {
  try {
    logger.info(
      LOGGER_INFO_CONST.EVENTS_RECEIVED(events.length, blockNumber?.toNumber())
    );

    const eventRepository = manager.getCustomRepository(EventRepository);
    const eventTypeRepository = manager.getCustomRepository(
      EventTypeRepository
    );
    const extrinsicRepository = manager.getCustomRepository(
      ExtrinsicRepository
    );
    const moduleRepository = manager.getCustomRepository(ModuleRepository);

    const trackedEvents: Event[] = [];
    const newEvents: EventModel[] = [];

    for (const [index, eventRecord] of events.entries()) {
      const { method, section, data } = eventRecord.event;
      if (
        (Object.values(CustomEventSection) as string[]).includes(
          eventRecord.event.section
        )
      ) {
        trackedEvents.push(eventRecord.event);
      }
      const extrinsicHash = findExtrinsicsWithEventsHash(
        extrinsicsWithBoundedEvents,
        eventRecord
      );
      const extrinsic = await extrinsicRepository.findByHash(extrinsicHash);
      try {
        const type = await eventTypeRepository.addOrIgnore({
          name: method,
        });

        const module = await moduleRepository.addOrIgnore({
          name: section,
        });

        const event = await eventRepository.add({
          index,
          data: transformEventData(data),
          extrinsicHash,
          extrinsicId: extrinsic?.extrinsicId || null,
          moduleId: module.moduleId,
          eventTypeId: type.eventTypeId,
          blockId,
        });
        newEvents.push(event);
      } catch (eventSaveError) {
        logger.error(
          LOGGER_ERROR_CONST.EVENT_SAVE_ERROR(
            `${section}.${method}`,
            blockNumber.toNumber()
          ),
          eventSaveError
        );
      }
    }
    logger.info(
      LOGGER_INFO_CONST.EVENTS_SAVED({
        blockId,
        blockNumber: blockNumber.toNumber(),
        length: events.length,
        savedLength: newEvents.length,
      })
    );

    return [newEvents, trackedEvents];
  } catch (error) {
    logger.error(error);
  }
}
