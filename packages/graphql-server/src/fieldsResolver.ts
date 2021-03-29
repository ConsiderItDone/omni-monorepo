import { ClassType } from "type-graphql";

export async function arrayFieldResolver<T>(
  parent: T,
  child: ClassType,
  field: string
): Promise<any> {
  const array = await (child as any).find({
    where: {
      [field]: (parent as any)[field],
    },
  });

  return array || [];
}
