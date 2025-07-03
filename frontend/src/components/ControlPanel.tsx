import { memo } from "react";
import type { GeoJSONStoreFeatures } from "terra-draw";

type Props = {
  routes: GeoJSONStoreFeatures[];
  changeMode: (mode: "linestring" | "select") => void;
};

function ControlPanel({ routes, changeMode }: Props) {
  return (
    <div className="control-panel">
      <h3>Routes</h3>
      <div>
        {routes.map((route) => (
          <pre>{JSON.stringify(route, null, 2)}</pre>
        ))}
      </div>
      <div>
        <button onClick={() => changeMode("linestring")}>Draw</button>
        <button onClick={() => changeMode("select")}>Select</button>
      </div>
    </div>
  );
}

export default memo(ControlPanel);
