import { useState } from "react";
import classNames from "classnames";

import { fetchData } from "@api";

import { useDbCounts } from "./DbCounts";

import { lsGetString, lsSetString } from "@utils";

export function AppHeader(): JSX.Element {
  const [username, setUsername] = useState(() => lsGetString("username") ?? "");
  const [syncing, setSyncing] = useState(false);

  const [counts, reloadCounts] = useDbCounts(username);

  async function loadData() {
    if (!username) return;
    setSyncing(true);
    lsSetString("username", username);
    await fetchData(username);
    reloadCounts();
    setSyncing(false);
  }

  return <div className="bg-gray-100 grid grid-cols-2 divide-x divide-gray-200">
    {/* Sync section */}
    <div className="mr-4 p-4 flex flex-col">
      {/* Username input */}
      <div className="mb-2">
        <label htmlFor="username" className="text-gray-700 text-sm font-bold mr-4">
          AniList Username
        </label>

        <input 
          type="text"
          id="username"
          placeholder="Username"
          disabled={syncing}
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="shadow appearance-none border rounded mr-2 p-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />

        <button
          onClick={loadData}
          disabled={syncing}
          className={classNames(
            "rounded px-4 py-2 text-white hover:bg-blue-300 transition",
            { "bg-blue-300": syncing, "bg-blue-400": !syncing },
          )}
        >
          Load data
        </button>
      </div>

      {/* Sync status */}
      {counts}
    </div>

    {/* Settings section */}
    <div className="mr-4 p-4 flex flex-col">
      Settings
    </div>
  </div>;
}
