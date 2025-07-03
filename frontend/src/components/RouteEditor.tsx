import { useCallback, useEffect, useRef, useState } from "react";
import { useMap } from "react-map-gl/maplibre";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import {
  TerraDraw,
  TerraDrawLineStringMode,
  TerraDrawSelectMode,
  type GeoJSONStoreFeatures,
} from "terra-draw";

import ControlPanel from "./ControlPanel";

function RouteEditor() {
  const { current: map } = useMap();
  const draw = useRef<TerraDraw | null>(null);
  const [routes, setRoutes] = useState<GeoJSONStoreFeatures[]>([]);

  useEffect(() => {
    if (map) {
      map.on("style.load", () => {
        if (!draw.current) {
          draw.current = new TerraDraw({
            adapter: new TerraDrawMapLibreGLAdapter({ map: map.getMap() }),
            modes: [
              new TerraDrawLineStringMode({}),
              new TerraDrawSelectMode({
                flags: {
                  linestring: {
                    feature: {
                      draggable: true,
                      coordinates: {
                        midpoints: false,
                        draggable: true,
                        deletable: true,
                      },
                    },
                  },
                },
              }),
            ],
          });

          console.log("Starting TerraDraw");
          draw.current.start();
          draw.current.setMode("linestring");
          draw.current.on("change", () => {
            const snapshot = draw.current?.getSnapshot();
            if (snapshot) {
              setRoutes(snapshot);
            }
          });
        }
      });
    }

    return () => {
      console.log("Stopping TerraDraw");
      draw.current?.stop();
    };
  }, [map, draw]);

  const changeMode = useCallback(
    (mode: "linestring" | "select") => {
      if (draw.current) {
        draw.current.setMode(mode);
      }
    },
    [draw]
  );

  return (
    <>
      <ControlPanel routes={routes} changeMode={changeMode} />
    </>
  );
}

export default RouteEditor;
