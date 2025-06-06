import { toast } from "sonner";
import { ArrowLeft, Mountain, MountainSnow, Upload } from "lucide-react";
import { LanguageContext } from "../../context";
import { FeaturePanelProps } from "./types/types";
import { useContext, useState, useEffect } from "react";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
import BasicInfo from "../aggregationPanel/components/basicInfo";
import LayerList from "./components/layerList";
import store from "@/store";

export default function FeaturePanel({
  onBack,
  layers,
  setLayers,
  selectedLayerId,
  setSelectedLayerId,
  ...props
}: FeaturePanelProps) {
  const { language } = useContext(LanguageContext);

  const handleBack = () => {
    const map = window.mapInstance;
    if (map) {
      const sourceId = `patch-bounds-edit`;
      const outlineLayerId = `patch-outline-edit`;

      if (map.getLayer(outlineLayerId)) {
        map.removeLayer(outlineLayerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
      const layers = map.getStyle()?.layers ?? [];
      layers.forEach((layer) => {
        if (layer.id.endsWith("feature")) {
          if (map.getLayer(layer.id)) {
            map.removeLayer(layer.id);
          }
        }
      });
      Object.keys(map.getStyle()?.sources ?? {}).forEach((sourceId) => {
        if (sourceId.endsWith("feature")) {
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        }
      });
      const draw = window.mapboxDrawInstance;
      if (draw) {
        draw.deleteAll();
      }
      setLayers([]);
      setSelectedLayerId(null);
    }
    if (onBack) {
      onBack();
    }
  };

  const handleSelectLayer = (id: string | null) => {
    setSelectedLayerId(id);
    store.get<{ on: Function }>("isEditSwitchAllowed")!.on();
    console.log("点击了图层", id);
  };

  return (
    <Sidebar {...props}>
      <SidebarContent>
        <div className="flex items-center p-3 justify-between">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-300 cursor-pointer"
            aria-label="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-4xl font-semibold text-center flex-1">
            {language === "zh" ? "要素编辑" : "Feature Editor"}
          </h1>
        </div>

        <div className="p-2 -mt-3 space-y-2">
          <BasicInfo />
          <LayerList
            layers={layers}
            setLayers={setLayers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={handleSelectLayer}
          />
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
