import { useState } from "react";

import { AppHeader } from "./AppHeader";
import { Graph } from "../graph/Graph";

export function AppLayout(): JSX.Element {
  const [selectedMedia, setSelectedMedia] = useState<number>();

  return <div className="flex flex-col h-screen">
    {/* Header/Settings */}
    <AppHeader setSelectedMedia={setSelectedMedia} />

    {/* Graph view */}
    <Graph mediaListId={selectedMedia} />
  </div>;
}
