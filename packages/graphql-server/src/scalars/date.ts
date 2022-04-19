import { GraphQLScalarType } from "graphql";

const DateTypeScalar = new GraphQLScalarType({
  name: "DateType",
  description: "Date type",
  parseValue(value: Date | number) {
    return new Date(value);
  },
});

export default DateTypeScalar;
