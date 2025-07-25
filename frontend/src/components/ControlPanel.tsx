import { memo, useId, useState } from "react";
import { Button } from "./ui/button";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

type Mode = "linestring" | "select";

type Props = {
  save: () => Promise<void>;
  changeMode: (mode: Mode) => void;
};

function ControlPanel({ changeMode, save }: Props) {
  const [mode, setMode] = useState<Mode>("linestring");
  const toggleGroupId = useId();

  return (
    <div className="control-panel">
      <p>Right click to delete a coordinate</p>
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
