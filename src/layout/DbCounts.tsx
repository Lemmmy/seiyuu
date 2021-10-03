import { useMemo } from "react";
import { useAsync } from "react-async";

import { db } from "@utils/db";
import { pluralN } from "@utils";

interface Counts {
  mediaList: number;
  characters: number;
  voiceActors: number;
}

interface Props extends Partial<Counts> {
  username?: string;
  isPending: boolean;
}

async function fetchCounts(): Promise<Counts> {
  const [mediaList, characters, voiceActors] = await Promise.all([
    db.mediaList.count(),
    db.characters.count(),
    db.voiceActors.count()
  ]);

  return { mediaList, characters, voiceActors };
}

export function useDbCounts(username?: string): [JSX.Element, () => void] {
  const { data, isPending, reload } = useAsync(fetchCounts);

  const el = useMemo(() => 
    <DbCounts username={username} {...data} isPending={isPending} />, 
  [username, data, isPending]);

  return [el, reload];
}

/** Counts of each database item type */
function DbCounts({ 
  username,
  isPending,
  mediaList, 
  characters, 
  voiceActors 
}: Props): JSX.Element {
  return <div className="text-gray-500 text-sm">
    {isPending
      ? "Reading database..."
      : (!username || isPending || !mediaList
        ? "No data yet!"
        : <>
          {/* Database item counts */}
          <span className="inline-block mr-2">{pluralN(mediaList ?? 0, "show")}</span>
          <span className="inline-block mr-2">{pluralN(characters ?? 0, "character")}</span>
          <span className="inline-block">{pluralN(voiceActors ?? 0, "voice actor")}</span>
        </>)}
  </div>;
}
