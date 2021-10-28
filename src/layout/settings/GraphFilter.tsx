import { useState } from "react";

interface Props {
  setGraphFilter: (filter?: string) => number;
}

export function GraphFilter({ 
  setGraphFilter
}: Props): JSX.Element {
  const [value, setValue] = useState<string>();

  function onChange(value?: string) {
    setValue(value);
    setGraphFilter(value?.trim() || undefined);
  }

  return <div className="flex">
    <input 
      type="text"
      id="filter"
      placeholder="Filter"
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      className="shadow appearance-none border rounded p-2 text-gray-700 leading-tight w-full focus:outline-none focus:shadow-outline"
    />
  </div>;
}
