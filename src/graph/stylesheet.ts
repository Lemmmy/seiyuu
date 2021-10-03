import { Stylesheet, Css } from "cytoscape";

export const STYLESHEET: Stylesheet[] = [
  {
    selector: "node",
    style: {
      "width": 10,
      "height": 10
    }
  },
  {
    selector: "node[label]",
    style: {
      "label": "data(label)"
    }
  },
  {
    selector: ":parent",
    style: {
      "background-opacity": 0.2
    }
  },
  { 
    selector: "edge",
    style: {
      "width": 1
    }
  },
  { 
    selector: ".root-edge",
    style: {
      "width": 3
    }
  },
  {
    selector: ".media",
    style: {
      "background-color": "purple"
    }
  },
  { 
    selector: ".root-node",
    style: {
      "width": 30,
      "height": 30,
      "background-color": "green",
    }
  },
  {
    selector: ".media[label]",
    style: {
      "font-weight": "bold"
    }
  },
  {
    selector: ".char",
    style: ({
      "width": 50,
      "height": 75,
      "shape": "round-rectangle",
      "background-color": "rgba(255, 255, 255, 0.5)",
      "background-fit": "contain",
      "bounds-expansion": "10px"
    } as any as Css.Node | Css.Edge | Css.Core)
  },
  {
    selector: ".va",
    style: ({
      "width": 100,
      "height": 150,
      "shape": "round-rectangle",
      "background-color": "rgba(255, 255, 255, 0.5)",
      "background-fit": "contain",
      "bounds-expansion": "20px"
    } as any as Css.Node | Css.Edge | Css.Core)
  },
  {
    selector: ".va[label]",
    style: {
      "font-style": "italic"
    }
  },
];
