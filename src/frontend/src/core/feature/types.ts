export interface FeatureSaveBody {
  feature_property: FeatureProperty;
  feature_json: Record<string, any>;
}

export interface FeatureProperty {
  id: string;
  name: string;
  type: string;
  icon: string;
  symbology: string;
}

export interface FeatureUpdatePropertyBody {
  name: string;
  icon: string;
  symbology: string;
}

export interface FeatureSaveResponse {
  success: boolean;
  message: string;
  resource_path: string;
}

export interface FeatureGetJsonBody {
  feature_name: string;
}

export interface FeatureGetJsonResponse {
  success: boolean;
  message: string;
  feature_json: Record<string, any>;
}

export interface FeatureList {
  success: boolean;
  message: string;
  feature_list: string[];
}
