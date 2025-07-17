import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

import RouteEditor from "./components/RouteEditor";
import { useEffect, useState } from "react";
import {
  TerraDraw,
  TerraDrawLineStringMode,
  TerraDrawSelectMode,
  type GeoJSONStoreFeatures,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import type { MapLibreEvent } from "maplibre-gl";
import { chillstreetsUrlsRoutes } from "./lib/api-client";

function App() {
  const [draw, setDraw] = useState<undefined | TerraDraw>();
  const [initialRoutes, setInitialRoutes] = useState<
    GeoJSONStoreFeatures[] | null
  >(null);

  // Fetch stored routes from backend
  useEffect(() => {
    const fetchRoutes = async () => {
      const { data } = await chillstreetsUrlsRoutes({
        baseUrl: "http://localhost:8000",
      });
      const routes = JSON.parse(data);
      if (Array.isArray(routes)) {
        setInitialRoutes(
          routes.map(({ geometry, ...route }: { geometry: string }) => ({
            // We're only storing the geometry in the db at the moment, so we lose the geojson
            // properties when saving. In order for terradraw to render these features, we need to
            // specify a mode property that is supported by our terradraw instance
            properties: { mode: "linestring" },
            geometry: JSON.parse(geometry),
            type: "Feature" as const,
            ...route,
          }))
        );
      }
    };
    fetchRoutes();
  }, []);

  // Add stored routes to map
  useEffect(() => {
    if (initialRoutes && draw) {
      draw.addFeatures(initialRoutes);
    }
  }, [initialRoutes, draw]);

  const setupDraw = async ({ target: map }: MapLibreEvent) => {
    if (draw) {
      return;
    }
    const terradraw = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map }),
      modes: [
        new TerraDrawLineStringMode({}),
        new TerraDrawSelectMode({
          keyEvents: {
            delete: "Backspace",
            deselect: "Esc",
            rotate: null,
            scale: null,
          },
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
    terradraw.start();
    terradraw.setMode("linestring");
    setDraw(terradraw);
  };

  return (
    <Map
      onLoad={setupDraw}
      initialViewState={{
        longitude: -87.62,
        latitude: 41.87,
        zoom: 11,
      }}
      mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
    >
      {draw && <RouteEditor draw={draw} />}
    </Map>
  );
}

export default App;
