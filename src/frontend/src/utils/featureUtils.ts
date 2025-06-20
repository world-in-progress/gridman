import { LayerItem } from "@/components/featurePanel/types/types";

export const addSourceToMap = (id: string, data: GeoJSON.FeatureCollection) => {
  const map = window.mapInstance;
  if (!map) return;
  map.addSource(id, {
    type: "geojson",
    data: data,
  });
};

export const addLayerToMap = (layer: LayerItem) => {
  const map = window.mapInstance;
  if (!map) return;
  if (layer.type === "polygon") {
    map.addLayer({
      id: layer.id,
      type: "fill",
      source: layer.id,
      paint: {
        "fill-color": layer.symbology.replace("-fill", ""),
        "fill-opacity": 0.5,
      },
    });
  } else if (layer.type === "line") {
    map.addLayer({
      id: layer.id,
      type: "line",
      source: layer.id,
      paint: {
        "line-color": layer.symbology.replace("-fill", ""),
        "line-width": 3,
      },
    });
  } else if (layer.type === "point") {
    map.addLayer({
      id: layer.id,
      type: "circle",
      source: layer.id,
      paint: {
        "circle-radius": 8,
        "circle-color": layer.symbology.replace("-fill", ""),
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
      },
    });
  }
};

export const removeLayerFromMap = (id: string) => {
  const map = window.mapInstance;
  if (!map) return;
  map.removeLayer(id);
};

export const removeSourceFromMap = (id: string) => {
  const map = window.mapInstance;
  if (!map) return;
  map.removeSource(id);
};

