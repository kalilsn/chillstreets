import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

import RouteEditor from "./components/RouteEditor";

function App() {
  return (
    <Map
      initialViewState={{
        longitude: -87.62,
        latitude: 41.87,
        zoom: 11,
      }}
      mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
    >
      <RouteEditor />
    </Map>
  );
}

export default App;
