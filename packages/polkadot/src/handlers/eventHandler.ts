import { EntityManager } from "typeorm";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { EventRecord, Event } from "@polkadot/types/interfaces/system";
import type { Vec } from "@polkadot/types";

import {
  EventRepository,
  ExtrinsicRepository,
  EventTypeRepository,
  ModuleRepository,
  Module,
  Extrinsic,
  EventType,
  Event as EventModel,
} from "@nodle/db";

import { findExtrinsicsWithEventsHash, transformEventData } from "../misc";
import { types, logger as Logger, CacheService, ExtrinsicWithBoundedEvents } from "@nodle/utils";
const { logger, LOGGER_ERROR_CONST, LOGGER_INFO_CONST } = Logger;
const CustomEventSection = types.CustomEventSection;
const cacheService = new CacheService();

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
