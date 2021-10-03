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

export function Graph(): JSX.Element | null {
  const { data, isPending } = useAsync<ElementDefinition[]>({ 
    promiseFn: resolveMediaList, 
    mediaListId: 222953532,
    graphData: []
  });

  if (isPending || !data) return null;

  return <CytoscapeComponent
    className="flex-1"
    elements={data} 
    layout={layout}

    stylesheet={STYLESHEET}
    wheelSensitivity={0.1}
  />;
}
