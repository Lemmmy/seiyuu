import { useRef, LegacyRef, useMemo, useCallback, useEffect } from "react";
import { useAsync } from "react-async";

import * as d3 from "d3";
import Fuse from "fuse.js";
import { FuseItem, GraphData, LinkType, NodeDatum, NodeObjType, resolveMediaList } from "./calcGraph";

import { useDebouncedResizeObserver } from "@utils";

import "./graph.css";

interface Props {
  d3Ref: LegacyRef<SVGSVGElement>;
  resizeRef: LegacyRef<HTMLDivElement>;
  width: number;
  height: number;
  isPending?: boolean;
  data?: GraphData;
  mediaListId?: number;
}

type GraphHookRes = [
  JSX.Element | null, // Graph el
  (filter?: string) => number // setFilter => number of results
];

export function useGraph(mediaListId?: number): GraphHookRes {
  const fuseRef = useRef<Fuse<FuseItem>>(new Fuse([], {
    threshold: 0.3,
    keys: ["names"]
  }));

  const { data, isPending } = useAsync<GraphData>({ 
    promiseFn: resolveMediaList, 
    mediaListId,
    fuse: fuseRef.current,
    watch: mediaListId
  });

  const d3Container = useRef<SVGSVGElement>(null);
  const { ref: resizeRef, width = 1, height = 1 } = useDebouncedResizeObserver<HTMLDivElement>(200);

  const el = useMemo(() => (
    <Graph 
      d3Ref={d3Container} 
      resizeRef={resizeRef} width={width} height={height} 
      isPending={isPending} 
      data={data} 
      mediaListId={mediaListId} 
    />
  ), [d3Container, resizeRef, width, height, isPending, data, mediaListId]);

  // Render the D3 graph
  useEffect(() => {
    if (!data || !d3Container.current) return;
    const svg = d3.select<SVGSVGElement, NodeDatum>(d3Container.current);
    renderGraph(svg, data);
  }, [data]);

  const setFilter = useCallback((filter?: string): number => {
    const fuse = fuseRef.current;
    if (!fuse || !d3Container.current) return -1;

    const svg = d3.select<SVGSVGElement, NodeDatum>(d3Container.current);

    // No search filter, re-show everything
    if (!filter) {
      svg.selectAll(".node").classed("filtered", false);
      return -1;
    }

    // Hide everything first
    svg.selectAll(".node").classed("filtered", true);

    // Perform the search and re-highlight all matches
    const results = fuse.search(filter);
    for (const result of results) {
      svg.select("#" + result.item.id).classed("filtered", false);
    }

    return results.length;
  }, []);

  return [el, setFilter];
}

const TYPE_RADII: Record<NodeObjType, number> = {
  "media": 4,
  "character": 10,
  "voice_actor": 25
};

function renderGraph(
  context: d3.Selection<SVGSVGElement, NodeDatum, null, undefined>,
  { nodes, links }: GraphData
): void {
  // ===========================================================================
  // parts
  // ===========================================================================
  const simulation = d3.forceSimulation<NodeDatum>(nodes)
    .force("link", d3.forceLink<NodeDatum, LinkType>(links)
      .distance(l => (l.target as NodeDatum).type === "media" ? 20 : 60)
      .id(d => d.id))
    .force("charge", d3.forceManyBody().distanceMax(500))
    .force("center", d3.forceCenter())
    .on("tick", onTick);

  const zoom = d3.zoom<SVGSVGElement, any>()
    .on("zoom", onZoom);
  context.call(zoom);
  
  const drag = d3.drag<any, NodeDatum>()
    .on("start", onDragStarted)
    .on("drag", onDrag)
    .on("end", onDragEnded);

    
  // ===========================================================================
  // drawing
  // ===========================================================================
  // circle clip paths for node images
  for (const type in TYPE_RADII) {
    const r = TYPE_RADII[type as NodeObjType];
    context.append("clipPath")
      .attr("id", "clip-" + type)
      .append("circle").attr("r", r).attr("cx", r).attr("cy", r);
  }

  const link = context.append("g")
      .classed("links", true)
    .selectAll("line")
    .data(links)
    .join("line")
      .classed("link", true)
      .style("stroke-width", l => (l.target as NodeDatum).type === "media" ? 1 : 3);

  const node = context.append("g")
      .classed("nodes", true)
    .selectAll(".node")
    .data(nodes)
    .enter().append("g")
      .attr("class", d => "type-" + d.type)
      .attr("id", d => d.id)
      .classed("node", true)
      .classed("fixed", d => d.fx !== undefined)
      .classed("root-character", d => !!d.rootCharacter)
      .call(drag)
      .on("click", onClick);

  node.append("circle")
    .attr("r", d => TYPE_RADII[d.type]);

  node.append("image")
    .attr("xlink:href", d => d.image ?? "")
    .attr("x", 0)
    .attr("y", d => TYPE_RADII[d.type] * -0.5)
    .attr("width", d => TYPE_RADII[d.type] * 2)
    .attr("height", d => TYPE_RADII[d.type] * 3)
    .attr("transform", d => `translate(${-TYPE_RADII[d.type]}, ${-TYPE_RADII[d.type]})`)
    .attr("clip-path", d => `url(#clip-${d.type})`);

  node.append("text")
    .classed("label", true)
    .attr("transform", d => `translate(0, ${TYPE_RADII[d.type] + 6})`)
    .text(d => d.label);

  node.append("title")
    .text(d => d.label);

  function onTick() {
    link
      .attr("x1", d => (d.source as NodeDatum).x ?? 0)
      .attr("y1", d => (d.source as NodeDatum).y ?? 0)
      .attr("x2", d => (d.target as NodeDatum).x ?? 0)
      .attr("y2", d => (d.target as NodeDatum).y ?? 0);

    node.attr("transform", d => `translate(${d.x}, ${d.y})`);
  }

  function onClick(this: any, _: unknown, d: NodeDatum) {
    delete d.fx;
    delete d.fy;
    d3.select(this).classed("fixed", false);
    simulation.alpha(1).restart();
  }

  function onDragStarted(this: any, e: any) {
    d3.select(this).classed("fixed", true);
  }
  
  function onDrag(e: any, d: NodeDatum) {
    e.subject.fx = e.x;
    e.subject.fy = e.y;
    simulation.alpha(1).restart();
  }
  
  function onDragEnded(e: any) {
  }

  function onZoom(e: any) {
    context.selectAll("svg > g")
      .attr("transform", e.transform);
  }
}

function Graph({ 
  d3Ref,
  resizeRef, width, height,
  isPending,
  data,
  mediaListId 
}: Props): JSX.Element | null {
  // Loading placeholder
  if (isPending)
    return <div className="flex-1 p-4 text-center text-gray-400">Loading</div>;
  // No data placeholder
  if (!data || !data.nodes.length || !mediaListId)
    return <div className="flex-1 p-4 text-center text-gray-400">No data</div>;

  return <div className="flex-1 relative" ref={resizeRef}>
    <svg
      ref={d3Ref}
      width={width}
      height={height}
      viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
      className="graph absolute"
    />
  </div>;
}
