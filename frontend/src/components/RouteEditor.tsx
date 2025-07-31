import { useCallback, useEffect, useState } from "react";
import { TerraDraw } from "terra-draw";

import ControlPanel from "./ControlPanel";
import type { OnChangeContext } from "node_modules/terra-draw/dist/common";
import { saveRouteChanges } from "@/lib/api-client";
import { client } from "@/lib/api-client/client.gen";
type TerraDrawChangeType = "create" | "update" | "delete" | "styling";

function RouteEditor({ draw }: { draw: TerraDraw }) {
  const [updated, setUpdated] = useState<string[]>([]);
  const [deleted, setDeleted] = useState<string[]>([]);

  const handleChange = useCallback(
    (ids: string[], type: TerraDrawChangeType, context: OnChangeContext) => {
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
        draw.off<"change">("change", handleChange);
      }
    };
  }, [draw, handleChange]);

  const changeMode = useCallback(
    (mode: "routesnap" | "select") => {
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
      if (snapshot && snapshot.geometry.type === "LineString") {
        hydratedUpdates[featureId] = JSON.stringify(snapshot.geometry);
      }
    }

    console.log("saving changes: ", {
      hydratedUpdates,
      updated,
      deleted,
    });

    await saveRouteChanges({
      client,
      body: { updated: hydratedUpdates, deleted },
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
