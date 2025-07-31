import { memo, useEffect, useId, useState } from "react";
import { Button } from "./ui/button";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { useMap } from "react-map-gl/maplibre";

type Mode = "routesnap" | "select";

type Props = {
  save: () => Promise<void>;
  changeMode: (mode: Mode) => void;
};

function ControlPanel({ changeMode, save }: Props) {
  const [mode, setMode] = useState<Mode>("routesnap");
  const [zoom, setZoom] = useState<number | undefined>();
  const toggleGroupId = useId();

  const { chillstreetsMap: map } = useMap();

  useEffect(() => {
    const handleZoom = () => {
      setZoom(map?.getZoom());
    };
    map?.on("zoom", handleZoom);

    return () => {
      map?.off("zoom", handleZoom);
    };
  }, [map]);

  const drawingEnabled = zoom && zoom >= 17;

  return (
    <div className="control-panel">
      {drawingEnabled ? (
        <>
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
            <ToggleGroupItem value="routesnap">Draw</ToggleGroupItem>
            <ToggleGroupItem value="select">Select</ToggleGroupItem>
          </ToggleGroup>

          <Button variant="default" onClick={save}>
            Save routes
          </Button>
        </>
      ) : (
        <p>Zoom in further to enable route drawing</p>
      )}
    </div>
  );
}

export default memo(ControlPanel);
