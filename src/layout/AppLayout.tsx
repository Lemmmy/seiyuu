import { useState } from "react";

import { AppHeader } from "./AppHeader";
import { useGraph } from "../graph/Graph";

export function AppLayout(): JSX.Element {
  const [selectedMedia, setSelectedMedia] = useState<number>();
  const [graph, setGraphFilter] = useGraph(selectedMedia);

  return <div className="flex flex-col h-screen">
    {/* Header/Settings */}
    <AppHeader 
      setSelectedMedia={setSelectedMedia} 
      setGraphFilter={setGraphFilter}
    />

    {/* Graph view */}
    {graph}
  </div>;
}
