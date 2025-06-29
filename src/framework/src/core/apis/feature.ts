import IAPI, { BaseResponse, FeatureStatus, FeatureMeta } from "./types";
import {
  FeatureSaveBody,
  FeatureSaveResponse,
  FeatureGetJsonBody,
  FeatureGetJsonResponse,
  FeatureList,
  FeatureUpdatePropertyBody,
} from "../feature/types";

const API_PREFIX = "/local/api/feature";

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
      console.log("responseData: ", responseData);
      return responseData;
    } catch (error) {
      throw new Error(`Failed to save feature: ${error}`);
    }
  },
};

export const deleteFeature: IAPI<{ id: string }, void> = {
  api: `${API_PREFIX}`,
  fetch: async (query: { id: string }): Promise<void> => {
    const response = await fetch(`${deleteFeature.api}/${query.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData: BaseResponse = await response.json();
    if (!responseData.success) {
      throw new Error(`Failed to delete feature: ${responseData.message}`);
    }
  },
};

export const updateFeatureProperty: IAPI<
  { id: string; featureProperty: FeatureUpdatePropertyBody },
  void
> = {
  api: `${API_PREFIX}`,
  fetch: async (query: {
    id: string;
    featureProperty: FeatureUpdatePropertyBody;
  }): Promise<void> => {
    const response = await fetch(`${updateFeatureProperty.api}/${query.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query.featureProperty),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData: BaseResponse = await response.json();
    if (!responseData.success) {
      throw new Error(
        `Failed to update feature property: ${responseData.message}`
      );
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

export const setCurrentPatchFeature: IAPI<
  { projectName: string; patchName: string },
  void
> = {
  api: `${API_PREFIX}/`,
  fetch: async (query: {
    projectName: string;
    patchName: string;
  }): Promise<void> => {
    try {
      const { projectName, patchName } = query;

      const response = await fetch(
        `${setCurrentPatchFeature.api}/${projectName}/${patchName}`,
        { method: "GET" }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData: BaseResponse = await response.json();
      if (!responseData.success) {
        throw new Error(
          `Failed to set current feature: ${responseData.message}`
        );
      }
    } catch (error) {
      throw new Error(`Failed to set current feature: ${error}`);
    }
  },
};

export const isFeatureReady: IAPI<void, boolean> = {
  api: `${API_PREFIX}`,
  fetch: async (): Promise<boolean> => {
    try {
      const response = await fetch(isFeatureReady.api, { method: "GET" });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData: FeatureStatus = await response.json();
      return responseData.is_ready;
    } catch (error) {
      throw new Error(`Failed to check feature readiness: ${error}`);
    }
  },
};

export const getFeatureMeta: IAPI<void, FeatureMeta> = {
  api: `${API_PREFIX}/meta`,
  fetch: async (): Promise<FeatureMeta> => {
    const response = await fetch(getFeatureMeta.api, { method: "GET" });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData: FeatureMeta = await response.json();
    return responseData;
  },
};

