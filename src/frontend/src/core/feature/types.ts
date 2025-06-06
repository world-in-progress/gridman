export interface FeatureSaveBody {
  feature_name: string;
  feature_type: string;
  feature_json: Record<string, any>;
}

export interface FeatureSaveResponse {
  success: boolean;
  message: string;
  resource_path: string;
}

export interface FeatureGetJsonBody {
  feature_name: string;
  feature_type: string;
}

export interface FeatureGetJsonResponse {
  success: boolean;
  message: string;
  feature_json: Record<string, any>;
}
