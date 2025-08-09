import { Layer, Source } from "react-map-gl/maplibre";
import { useEffect, useState } from "react";
import { getRouteOsmIntersections } from "../lib/api-client";
import { client } from "../lib/api-client/client.gen";
import type { Feature, FeatureCollection, LineString } from "geojson";

interface IntersectionProperties {
  osm_id: number | null;
  intersection_proportion: number | null;
}

interface IntersectionFeature extends Feature<LineString, IntersectionProperties> {}

interface IntersectionData extends FeatureCollection {
  features: IntersectionFeature[];
}

interface ClickedFeature {
  feature: IntersectionFeature;
  longitude: number;
  latitude: number;
}

export default function IntersectionViewer() {
  const [intersectionData, setIntersectionData] = useState<IntersectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntersections = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await getRouteOsmIntersections({ client });

        if (data && typeof data === 'object') {
          setIntersectionData(data as IntersectionData);
        }
      } catch (err) {
        console.error('Error fetching intersections:', err);
        setError('Failed to load intersection data');
      } finally {
        setLoading(false);
      }
    };

    fetchIntersections();
  }, []);


  if (loading) {
    return (
      <div className="absolute top-20 left-4 bg-white p-4 rounded-lg shadow-md z-10">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Loading intersection data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute top-20 left-4 bg-red-50 border border-red-200 p-4 rounded-lg shadow-md z-10">
        <div className="text-red-800">Error: {error}</div>
      </div>
    );
  }

  if (!intersectionData) {
    return null;
  }

  // Create style expressions for the features
  const lineColorExpression = [
    "case",
    ["!=", ["get", "intersection_proportion"], null],
    "#3b82f6", // Blue for features with intersection_proportion
    "#ef4444"  // Red for features without intersection_proportion
  ];

  const lineOpacityExpression = [
    "case",
    ["!=", ["get", "intersection_proportion"], null],
    [
      "interpolate",
      ["linear"],
      ["get", "intersection_proportion"],
      0, 0.2,  // 20% opacity at proportion 0
      1, 1.0   // 100% opacity at proportion 1
    ],
    0.2 // 20% opacity for null values (red lines)
  ];

  return (
    <>
      <Source
        id="route-intersections"
        type="geojson"
        data={intersectionData}
      >
        <Layer
          id="intersection-lines"
          type="line"
          source="route-intersections"
          paint={{
            "line-color": lineColorExpression,
            "line-opacity": lineOpacityExpression,
            "line-width": 3,
          }}
        />
      </Source>


      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md z-10">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span>Has OSM match (opacity = proportion)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span>No OSM match</span>
          </div>
        </div>
      </div>
    </>
  );
}
