import { memo, useCallback, useId, useState } from "react";
import type { GeoJSONStoreFeatures } from "terra-draw";
import { Button } from "./ui/button";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

type Mode = "linestring" | "select";

type Props = {
  routes: GeoJSONStoreFeatures[];
  changeMode: (mode: Mode) => void;
};

function ControlPanel({ routes, changeMode }: Props) {
  const [mode, setMode] = useState<Mode>("linestring");
  const toggleGroupId = useId();

  const save = useCallback(async () => {
    console.log("saving routes: ", routes);
  }, [routes]);

  return (
    <div className="control-panel">
      <ToggleGroup
        id={toggleGroupId}
        type="single"
        value={mode}
        variant="outline"
        onValueChange={(mode: Mode) => {
          setMode(mode);
          changeMode(mode);
        }}
        className="my-2"
      >
        <ToggleGroupItem value="linestring">Draw</ToggleGroupItem>
        <ToggleGroupItem value="select">Select</ToggleGroupItem>
      </ToggleGroup>

      <Button variant="default" onClick={save}>
        Save routes
      </Button>
    </div>
  );
}

export default memo(ControlPanel);
