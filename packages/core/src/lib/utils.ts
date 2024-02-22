export const compact = <T>(array: (T | null | undefined)[]): T[] => {
  return array.filter(Boolean) as T[];
};

export const uniqueById = <T>(array: (T & { id: any })[]): T[] =>
  array.filter((v, i, a) => a.findIndex((v2) => v2?.id === v?.id) === i);
