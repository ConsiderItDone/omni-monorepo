import { EntityManager } from "typeorm";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { EventRecord, Event } from "@polkadot/types/interfaces/system";
import type { Vec } from "@polkadot/types";

import EventRepository from "@nodle/db/src/repositories/public/eventRepository";
import ExtrinsicRepository from "@nodle/db/src/repositories/public/extrinsicRepository";
import { findExtrinsicsWithEventsHash, transformEventData } from "@nodle/polkadot/src/misc";
import { ExtrinsicWithBoundedEvents, CustomEventSection } from "@nodle/utils/src/types";
import { logger, LOGGER_INFO_CONST, LOGGER_ERROR_CONST } from "@nodle/utils/src/logger";
import { default as EventModel } from "@nodle/db/src/models/public/event";
import EventTypeRepository from "@nodle/db/src/repositories/public/eventTypeRepository";
import ModuleRepository from "@nodle/db/src/repositories/public/moduleRepository";
import { cacheService } from "@nodle/utils/src/services/cacheService";
import { Module, Extrinsic } from "@nodle/db/src/models";
import EventType from "@nodle/db/src/models/public/eventType";

export async function handleEvents(
  manager: EntityManager,
  events: Vec<EventRecord>,
  extrinsicsWithBoundedEvents: ExtrinsicWithBoundedEvents[],
  blockId: number,
  blockNumber: BlockNumber
): Promise<[EventModel[], Event[]]> {
  try {
    logger.info(LOGGER_INFO_CONST.EVENTS_RECEIVED(events.length, blockNumber?.toNumber()));

    const eventRepository = manager.getCustomRepository(EventRepository);
    const eventTypeRepository = manager.getCustomRepository(EventTypeRepository);
    const extrinsicRepository = manager.getCustomRepository(ExtrinsicRepository);
    const moduleRepository = manager.getCustomRepository(ModuleRepository);

    const trackedEvents: Event[] = [];
    const newEvents: EventModel[] = [];

    const extrinsicCache = new Map<string, Extrinsic>();
    const moduleCache = new Map<string, Module>();
    const typeCache = new Map<string, EventType>();

    for (const [index, eventRecord] of events.entries()) {
      const { method, section, data } = eventRecord.event;
      if ((Object.values(CustomEventSection) as string[]).includes(eventRecord.event.section)) {
        trackedEvents.push(eventRecord.event);
      }
      const extrinsicHash = findExtrinsicsWithEventsHash(extrinsicsWithBoundedEvents, eventRecord);

      let extrinsic: Extrinsic;
      if (extrinsicCache.has(extrinsicHash)) {
        extrinsic = extrinsicCache.get(extrinsicHash);
      } else {
        extrinsic = await extrinsicRepository.findByHash(extrinsicHash);
        extrinsicCache.set(extrinsicHash, extrinsic);
      }

      let module: Module;
      // search in local cache
      if (moduleCache.has(section)) {
        module = moduleCache.get(section);
      } else {
        module = await moduleRepository.addOrIgnore({
          name: section,
        });
        moduleCache.set(section, module);
      }

      let eventType: EventType;
      const typeKey = `${method}-${module.moduleId}`;
      // search in local cache
      if (typeCache.has(typeKey)) {
        eventType = typeCache.get(typeKey);
      } else {
        eventType = await eventTypeRepository.addOrIgnore({
          name: method,
          moduleId: module.moduleId,
        });
        typeCache.set(typeKey, eventType);
      }

      try {
        const transformedData = transformEventData(data);
        console.time("event save");
        const event = await eventRepository.add({
          index,
          data: transformedData,
          extrinsicHash,
          extrinsicId: extrinsic?.extrinsicId || null,
          moduleId: module.moduleId,
          eventTypeId: eventType.eventTypeId,
          blockId,
        });
        console.timeEnd("event save");

        const dataKeys = Object.keys(transformedData);
        if (dataKeys.includes("from")) {
          cacheService.delByPattern(`events*"from":"${(transformedData as any).from}"*`); // eslint-disable-line
        }
        if (dataKeys.includes("to")) {
          cacheService.delByPattern(`events*"to":"${(transformedData as any).to}"*`); // eslint-disable-line
        }
        if (dataKeys.includes("who")) {
          cacheService.delByPattern(`events*"who":"${(transformedData as any).who}"*`); // eslint-disable-line
        }

        cacheService.delByPattern(`events-${module.moduleId}-${eventType.eventTypeId}-*`);

        newEvents.push(event);
      } catch (eventSaveError) {
        logger.error(
          LOGGER_ERROR_CONST.EVENT_SAVE_ERROR(`${section}.${method}`, blockNumber.toNumber()),
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
