import { Resolver } from "type-graphql";
import VestingSchedule from "@nodle/db/src/models/public/vestingSchedule";
import { createBaseResolver } from "../baseResolver";

const VestingScheduleBaseResolver = createBaseResolver(
  "VestingSchedule",
  VestingSchedule
);

@Resolver(VestingSchedule)
export default class VestingScheduleResolver extends VestingScheduleBaseResolver {}
