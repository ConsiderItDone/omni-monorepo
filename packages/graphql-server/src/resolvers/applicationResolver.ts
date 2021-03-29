import { Resolver } from "type-graphql";
import Application from "@nodle/db/src/models/public/application";
import { createBaseResolver } from "../baseResolver";

const ApplicationBaseResolver = createBaseResolver("Application", Application);

@Resolver(Application)
export default class ApplicationResolver extends ApplicationBaseResolver {}
