import { AppHeader } from "./AppHeader";
import { Graph } from "../graph/Graph";

export function AppLayout(): JSX.Element {
  return <div className="flex flex-col h-screen">
    {/* Header/Settings */}
    <AppHeader />

    {/* Graph view */}
    <Graph />
  </div>;
}
