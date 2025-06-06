import IAPI from "../types";
import {
  FeatureSaveBody,
  FeatureSaveResponse,
  FeatureGetJsonBody,
  FeatureGetJsonResponse,
} from "../../feature/types";

const API_PREFIX = "/api/feature/operation";

export const saveFeature: IAPI<FeatureSaveBody, FeatureSaveResponse> = {
  api: `${API_PREFIX}/save`,
  fetch: async (query: FeatureSaveBody): Promise<FeatureSaveResponse> => {
    try {
      const response = await fetch(saveFeature.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData: FeatureSaveResponse = await response.json();
      return responseData;
    } catch (error) {
      throw new Error(`Failed to save feature: ${error}`);
    }
  },
};

export const getFeatureJson: IAPI<FeatureGetJsonBody, FeatureGetJsonResponse> =
  {
    api: `${API_PREFIX}/get_feature_json`,
    fetch: async (
      query: FeatureGetJsonBody
    ): Promise<FeatureGetJsonResponse> => {
      const response = await fetch(getFeatureJson.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData: FeatureGetJsonResponse = await response.json();
      return responseData;
    },
  };

