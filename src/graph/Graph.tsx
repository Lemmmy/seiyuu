import { useAsync } from "react-async";

import Cytoscape, { ElementDefinition } from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import COSEBilkent from "cytoscape-cose-bilkent";

import { resolveMediaList } from "./calcGraph";
import { STYLESHEET } from "./stylesheet";

Cytoscape.use(COSEBilkent);

const layout = { 
  name: "cose-bilkent",
  quality: "proof",
  // grid: true,
  nodeDimensionsIncludeLabels: true,
  avoidOverlap: true,
  padding: 50,
  boundingBox: { x1: -960, y1: -540, x2: 960, y2: 540 }
  // randomize: true
};

interface Props {
  mediaListId?: number;
}

export function Graph({ mediaListId }: Props): JSX.Element | null {
  const { data, isPending } = useAsync<ElementDefinition[]>({ 
    promiseFn: resolveMediaList, 
    mediaListId,
    watch: mediaListId,
    graphData: []
  });

  // Loading placeholder
  if (isPending)
    return <div className="flex-1 p-4 text-center text-gray-400">Loading</div>;
  // No data placeholder
  if (!data || !data.length || !mediaListId)
    return <div className="flex-1 p-4 text-center text-gray-400">No data</div>;

  return <CytoscapeComponent
    className="flex-1"
    elements={data} 
    layout={layout}

    stylesheet={STYLESHEET}
    wheelSensitivity={0.1}
  />;
}
