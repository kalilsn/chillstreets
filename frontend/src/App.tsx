import { Layer, Map, MapProvider, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

import RouteEditor from "./components/RouteEditor";
import IntersectionViewer from "./components/IntersectionViewer";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TerraDraw,
  TerraDrawSelectMode,
  type GeoJSONStoreFeatures,
} from "terra-draw";
import { TerraRoute, createCheapRuler } from "terra-route";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import type { MapLibreEvent, MapSourceDataEvent } from "maplibre-gl";
import { getRoutes } from "./lib/api-client";
import { client } from "./lib/api-client/client.gen";
import {
  Routing,
  TerraDrawRouteSnapMode,
  type RoutingInterface,
} from "./lib/terradraw-route-snap-mode/terra-draw-route-snap-mode";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  LineString,
} from "geojson";

const waysSourceId = "chicago-ways";

function App() {
  const [draw, setDraw] = useState<undefined | TerraDraw>();
  const [network, setNetwork] = useState<
    undefined | FeatureCollection<LineString>
  >();
  const [initialRoutes, setInitialRoutes] = useState<
    GeoJSONStoreFeatures[] | null
  >(null);
  const [showIntersections, setShowIntersections] = useState(false);

  // Fetch stored routes from backend
  useEffect(() => {
    const fetchRoutes = async () => {
      const { data: routes } = await getRoutes({
        client,
      });

      if (Array.isArray(routes)) {
        setInitialRoutes(
          routes.map(({ geometry, ...route }) => ({
            // We're only storing the geometry in the db at the moment, so we lose the geojson
            // properties when saving. In order for terradraw to render these features, we need to
            // specify a mode property that is supported by our terradraw instance
            properties: { mode: "routesnap" },
            type: "Feature" as const,
            geometry: JSON.parse(geometry),
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

  // Whenever new tile data is loaded from the chicago_ways vector tile source
  // we query maplibre for the geojson representation of the features in that source
  // and store it in `network`
  const handleTileLoad: (e: MapSourceDataEvent) => void = useCallback((e) => {
    if (e.sourceId !== waysSourceId || !e.isSourceLoaded) {
      return;
    }

    const features = e.target.querySourceFeatures(waysSourceId, {
      sourceLayer: "default", // Name of the layer in the tile to use. ST_AsMVT defaults to "default"
      filter: ["==", ["geometry-type"], "LineString"],
    }) as Feature<LineString, GeoJsonProperties>[];

    setNetwork({
      type: "FeatureCollection",
      features,
    });
  }, []);

  // Build a graph from the geojson features in network whenever network changes
  const routing = useMemo(() => {
    if (network?.features.length) {
      const measureDistance = createCheapRuler(
        network.features[0].geometry.coordinates[0][1]
      );
      const terraRoute = new TerraRoute({
        distanceMeasurement: measureDistance,
      });
      terraRoute.buildRouteGraph(network);
      return new Routing({
        network,
        useCache: true,
        routeFinder: terraRoute,
      });
    }
    // Return a dummy router that doesn't work before way tiles are loaded
    return {} as RoutingInterface;
  }, [network]);

  useEffect(() => {
    if (draw) {
      draw.updateModeOptions("routesnap", {
        routing,
      });
    }
  }, [draw, routing]);

  const setupDraw = useCallback(
    async ({ target: map }: MapLibreEvent) => {
      if (draw) {
        return;
      }

      const terradraw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [
          // new TerraDrawRenderMode({
          //   modeName: "snapped-routes",
          //   styles: {
          //     //@ts-expect-error Library type expects a hex color, but rgba works (https://github.com/JamesLMilner/terra-draw/issues/442)
          //     lineStringColor: "rgba(1,100,1,0.3)",
          //     lineStringWidth: 10,
          //   },
          // }),
          new TerraDrawRouteSnapMode({
            routing,
            maxPoints: 100,
          }),
          new TerraDrawSelectMode({
            keyEvents: {
              delete: "Backspace",
              deselect: "Esc",
              rotate: null,
              scale: null,
            },
            styles: {},
            flags: {
              routesnap: {
                feature: {
                  draggable: true,
                  coordinates: {
                    midpoints: true,
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
      terradraw.setMode("select");
      setDraw(terradraw);
    },
    [draw, routing]
  );


  return (
    <MapProvider>
      <Map
        id="chillstreetsMap"
        onSourceData={handleTileLoad}
        onLoad={setupDraw}
        initialViewState={{
          longitude: -87.62,
          latitude: 41.87,
          zoom: 11,
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
      >
        <Source
          id={waysSourceId}
          type="vector"
          minzoom={17}
          tiles={[
            `${
              process.env.API_URL ?? "http://localhost:8000/api"
            }/ways/{z}/{x}/{y}`,
          ]}
        >
          <Layer
            source-layer="default"
            type="line"
            source={waysSourceId}
            paint={{ "line-opacity": 0 }}
          />
        </Source>
        {showIntersections && <IntersectionViewer />}
        {draw && !showIntersections && <RouteEditor draw={draw} />}
      </Map>

      {/* Toggle button */}
      <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-md z-10">
        <button
          onClick={() => setShowIntersections(!showIntersections)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showIntersections ? 'Hide Intersections' : 'Show Intersections'}
        </button>
      </div>
    </MapProvider>
  );
}

export default App;
