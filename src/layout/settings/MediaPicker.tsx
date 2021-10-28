import { ReactNode, useMemo, useState } from "react";
import { useAsync } from "react-async";

import { db } from "@utils/db";
import { StoredMediaList } from "@api";

interface MediaOption {
  value: number;
  label: ReactNode;
}

interface Props {
  data: MediaOption[];
  setSelectedMedia: (mediaListId?: number) => void;
}

const mediaTitle = (m: StoredMediaList): string =>
  m.media.title.english ?? m.media.title.romaji ?? m.media.title.native 
    ?? "Unknown mediaa";

async function fetchMedia(): Promise<MediaOption[]> {
  const mediaList = await db.mediaList.toArray();

  // Sort the media by title alphabetically
  mediaList.sort((a, b) => 
    mediaTitle(a).localeCompare(mediaTitle(b), undefined, 
      { sensitivity: "base", numeric: true }));

  return mediaList.map(m => ({
    value: m.id,
    label: mediaTitle(m)
  }))
}

export function useMediaPicker(
  setSelectedMedia: (mediaListId?: number) => void
): [JSX.Element | null, () => void] {
  const { data, isPending, reload } = useAsync(fetchMedia);

  const el = useMemo(() =>
    !isPending && data?.length 
      ? <MediaPicker data={data} setSelectedMedia={setSelectedMedia} /> 
      : null,
  [data, isPending, setSelectedMedia]);

  return [el, reload];
}

function MediaPicker({ 
  data,
  setSelectedMedia
}: Props): JSX.Element {
  const [value, setValue] = useState<number>(data[0].value);

  function onCommit() {
    setSelectedMedia(value ?? data[0].value);
  }

  return <div className="flex mb-2">
    {/* Picker */}
    <select
      value={value}
      onChange={e => setValue(Number(e.target.value))}
      className="w-full flex-1 mr-2 p-2 shadow rounded"
    >
      {data.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>

    {/* Commit button */}    
    <button
      onClick={onCommit}
      className={"rounded px-2 py-1 text-white bg-blue-500 hover:bg-blue-400 transition"}
    >
      Graph characters
    </button>
  </div>;
}
