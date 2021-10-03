import { nts } from "@utils";

export function pluralN(n: number, singular: string, plural?: string): string {
  const word = n === 1 ? singular : (plural || singular + "s");
  return `${nts(n)} ${word}`;
}
