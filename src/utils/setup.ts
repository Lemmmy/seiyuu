import Cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";

import Debug from "debug";

Cytoscape.use(fcose);

Debug.enable("seiyuu:*");
localStorage.setItem("debug", "seiyuu:*");
