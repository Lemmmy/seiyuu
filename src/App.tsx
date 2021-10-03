import { useEffect, useState } from "react";

import { AppLayout } from "./layout/AppLayout";
import "./App.css";

import { initDatabase } from "./utils/db";

import Debug from "debug";
const debug = Debug("seiyuu:app");

function App(): JSX.Element {
  const [dbInit, setDbInit] = useState(false);
  debug("App render: dbInit %o", dbInit);

  useEffect(() => {
    if (dbInit) return;
    initDatabase()
      .then(() => setDbInit(true))
      .catch(console.error);
  }, [dbInit]);

  if (!dbInit) return <>Loading...</>;

  return <AppLayout />;
}

export default App;
