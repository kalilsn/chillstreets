import { useCallback, useEffect, useState } from "react";
import { TerraDraw } from "terra-draw";

import ControlPanel from "./ControlPanel";
import type { FeatureId } from "node_modules/terra-draw/dist/store/store";
import { chillstreetsUrlsSave } from "@/lib/api-client";
import type { OnChangeContext } from "node_modules/terra-draw/dist/common";
type TerraDrawChangeType = "create" | "update" | "delete" | "styling";

function RouteEditor({ draw }: { draw: TerraDraw }) {
  const [updated, setUpdated] = useState<FeatureId[]>([]);
  const [deleted, setDeleted] = useState<FeatureId[]>([]);

  const handleChange = useCallback(
    (ids: FeatureId[], type: TerraDrawChangeType, context: OnChangeContext) => {
      if (context && context.origin === "api") {
        // Ignore programmatic changes to data (such as adding the initial routes)
        return;
      }
      if (type === "create" || type === "update") {
        // Filter for uniqueness and to make sure deleted features aren't added to the updates array
        setUpdated((updated) => [
          ...updated,
          ...ids.filter((id) => ![...updated, ...deleted].includes(id)),
        ]);
      }
      if (type === "delete") {
        setDeleted((deleted) => [
          ...deleted,
          ...ids.filter((id) => !deleted.includes(id)),
        ]);
        // Remove any newly deleted features from the updates array
        setUpdated((updated) => updated.filter((id) => !ids.includes(id)));
      }
    },
    [deleted]
  );

  useEffect(() => {
    if (draw) {
      // @ts-expect-error the library's FeatureId type is broader than needed
      draw.on("change", handleChange);
    }
    return () => {
      if (draw) {
        // @ts-expect-error the library's FeatureId type is broader than needed
        draw.off("change", handleChange);
      }
    };
  }, [draw, handleChange]);

  const changeMode = useCallback(
    (mode: "linestring" | "select") => {
      if (draw) {
        draw.setMode(mode);
      }
    },
    [draw]
  );

  const save = useCallback(async () => {
    if (!draw) {
      return;
    }
    const hydratedUpdates: Record<string, string> = {};
    for (const featureId of updated) {
      const snapshot = draw.getSnapshotFeature(featureId);
      if (snapshot) {
        console.log("snapshot", snapshot);
        hydratedUpdates[featureId] = JSON.stringify(snapshot.geometry);
      }
    }

    console.log("saving changes: ", {
      updated,
      deleted,
    });

    await chillstreetsUrlsSave({
      // @ts-expect-error FeatureId issue once again. It's a string!
      body: { updated: hydratedUpdates, deleted },
      baseUrl: "http://localhost:8000",
    });

    // Clear out the state
    setUpdated([]);
    setDeleted([]);
  }, [draw, updated, deleted]);

  return (
    <>
      <ControlPanel changeMode={changeMode} save={save} />
    </>
  );
}

export default RouteEditor;
