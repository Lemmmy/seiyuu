import { useRef, MutableRefObject, useMemo, useCallback } from "react";
import { useAsync } from "react-async";

import Cytoscape, { ElementDefinition } from "cytoscape";
import CytoscapeComponent from "@lemmmy/react-cytoscapejs";

import Fuse from "fuse.js";

import { FuseItem, resolveMediaList } from "./calcGraph";
import { STYLESHEET } from "./stylesheet";

const layout = { 
  name: "fcose",
  quality: "default",
  // grid: true,
  nodeDimensionsIncludeLabels: true,
  avoidOverlap: true,
  padding: 50,
  boundingBox: { x1: -960, y1: -540, x2: 960, y2: 540 },
  idealEdgeLength: 250
  // randomize: true
};

interface Props {
  cyRef: MutableRefObject<Cytoscape.Core | undefined>;
  isPending?: boolean;
  data?: ElementDefinition[];
  mediaListId?: number;
}

type GraphHookRes = [
  JSX.Element | null, // Graph el
  (filter?: string) => number // setFilter => number of results
];

export function useGraph(mediaListId?: number): GraphHookRes {
  const cyRef = useRef<Cytoscape.Core>();
  const fuseRef = useRef<Fuse<FuseItem>>(new Fuse([], {
    threshold: 0.3,
    keys: ["names"]
  }));

  const { data, isPending } = useAsync<ElementDefinition[]>({ 
    promiseFn: resolveMediaList, 
    mediaListId,
    fuse: fuseRef.current,
    watch: mediaListId,
    graphData: []
  });

  const el = useMemo(() => 
    <Graph cyRef={cyRef} isPending={isPending} data={data} mediaListId={mediaListId} />, 
  [cyRef, isPending, data, mediaListId]);

  const setFilter = useCallback((filter?: string): number => {
    const cy = cyRef.current;
    const fuse = fuseRef.current;
    if (!cy || !fuse) return -1;

    // No search filter, re-show everything
    if (!filter) {
      cy.nodes().removeClass("filtered");
      return -1;
    }

    // Hide everything first
    cy.nodes().addClass("filtered");

    // Perform the search and re-highlight all matches
    const results = fuse.search(filter);
    for (const result of results) {
      cy.getElementById(result.item.id).removeClass("filtered");
    }

    return 1;
  }, [cyRef]);

  return [el, setFilter];
}

function Graph({ 
  cyRef,
  isPending,
  data,
  mediaListId 
}: Props): JSX.Element | null {
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
    cy={cy => {
      cyRef.current = cy;
      
      cy.unbind("select");
      cy.bind("select", e => {
        e.target.addClass("highlighted");
        cy.edges(`[source='${e.target.id()}']`).addClass("highlighted");
      });
      
      cy.unbind("unselect");
      cy.bind("unselect", e => {
        e.target.removeClass("highlighted");
        cy.edges(`[source='${e.target.id()}']`).removeClass("highlighted");
      });
      
      cy.unbind("dbltap");
      cy.bind("dbltap", e => {
        if (e.target.group() === "nodes") {
          const targets = cy.edges(`[source='${e.target.id()}']`).targets();
          console.log(targets);
          setTimeout(() => targets.select(), 50);
        }
      });
    }}
  />;
}
