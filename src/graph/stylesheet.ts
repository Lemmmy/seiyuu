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
    style: ({
      "width": 1,
      "line-color": "black",
      "line-opacity": 0.4
    } as any as Css.Node | Css.Edge | Css.Core)
  },
  { 
    selector: "edge.highlighted",
    style: ({
      "width": 3,
      "line-color": "blue",
      "line-opacity": 1
    } as any as Css.Node | Css.Edge | Css.Core)
  },
  { 
    selector: ".root-edge",
    style: ({
      "width": 3,
      "line-color": "black",
      "line-opacity": 0.6
    } as any as Css.Node | Css.Edge | Css.Core)
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
      "background-color": "white",
      "background-fit": "contain",
      "bounds-expansion": "10px"
    } as any as Css.Node | Css.Edge | Css.Core)
  },
  {
    selector: ".root-node-child",
    style: ({
      "width": 50,
      "height": 75,
      "shape": "round-rectangle",
      "background-color": "green",
      "background-fit": "contain",
      "border-width": 3,
      "border-color": "#00AA00",
      "bounds-expansion": "10px",
      "opacity": 0.9,
    } as any as Css.Node | Css.Edge | Css.Core)
  },
  {
    selector: ".va",
    style: ({
      "width": 100,
      "height": 150,
      "shape": "round-rectangle",
      "background-color": "white",
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
  { 
    selector: "node.highlighted",
    style: ({
      "border-width": 5,
      "border-color": "blue",
    } as any as Css.Node | Css.Edge | Css.Core)
  },
  { 
    selector: "node.filtered",
    style: ({
      "opacity": 0.3,
    } as any as Css.Node | Css.Edge | Css.Core)
  }
];
