import { Resolver } from "type-graphql";
import EventType from "@nodle/db/src/models/public/eventType";
import { createBaseResolver } from "../baseResolver";

const EventTypeBaseResolver = createBaseResolver("EventType", EventType);

@Resolver(EventType)
export default class EventTypeResolver extends EventTypeBaseResolver {}
