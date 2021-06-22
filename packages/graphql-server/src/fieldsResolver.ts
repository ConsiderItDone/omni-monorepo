import { ClassType } from "type-graphql";

/* eslint @typescript-eslint/no-explicit-any: 0 */

export async function arrayFieldResolver<T>(
  parent: T,
  child: ClassType,
  field: string,
  field2?: string,
  where: any = {}, // eslint-disable-line
  order: any = null // eslint-disable-line
): Promise<any[]> {
  const array = await (child as any).find({
    where: {
      ...where,
      [field]: (parent as any)[field2 || field],
    },
    order,
  });

  return array || [];
}

export async function singleFieldResolver<T>(
  parent: T,
  child: ClassType,
  field: string,
  field2?: string
): Promise<any> {
  const obj = await (child as any).findOne({
    where: {
      [field]: (parent as any)[field2 || field],
    },
  });

  return obj;
}
