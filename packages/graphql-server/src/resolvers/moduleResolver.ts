import { Resolver } from "type-graphql";
import Module from "@nodle/db/src/models/public/module";
import { createBaseResolver } from "../baseResolver";

const ModuleBaseResolver = createBaseResolver("Module", Module);

@Resolver(Module)
export default class ModuleResolver extends ModuleBaseResolver {}
